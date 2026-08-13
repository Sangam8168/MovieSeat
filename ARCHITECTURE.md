# MovieSeat — Architecture & Design Notes

A full-stack cinema ticket booking platform. Users browse films, pick a showtime,
select seats on an interactive map, and pay via Stripe. Admins schedule shows and
monitor bookings from a separate dashboard.

This document is written for technical interviews: it covers the structure, the
non-obvious design decisions, and the trade-offs behind them.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite | Fast HMR, small production bundle |
| Routing | React Router 7 | Nested routes for the admin area |
| Styling | Tailwind CSS 4 | Utility-first, no separate stylesheet to keep in sync |
| Animation | Framer Motion 11 | Scroll-linked animation via `useScroll` / `useTransform` |
| Backend | Node + Express 5 | Small, explicit, easy to deploy serverless |
| Database | MongoDB + Mongoose 9 | Flexible seat maps; schema-per-model validation |
| Auth | JWT + bcrypt + Google Identity Services | No third-party auth vendor lock-in |
| Payments | Stripe Checkout | Hosted PCI-compliant page; no card data touches our servers |
| Background jobs | Inngest (optional) | Emails and reminders, deliberately non-critical |
| Hosting | Vercel (two projects) | Static frontend + serverless API from one repo |

---

## 2. Repository Layout

Two independently deployable applications in one repository.

```
MovieSeat/
├── client/                    # React SPA  -> Vercel static
│   ├── src/
│   │   ├── components/        # Reusable UI
│   │   │   ├── motion/        # Shared animation primitives
│   │   │   └── admin/         # Admin chrome
│   │   ├── pages/             # Route-level components
│   │   │   └── admin/         # Admin routes
│   │   ├── context/           # AppContext: global state
│   │   ├── lib/               # Pure helpers (formatting, image URLs)
│   │   └── assets/
│   └── vercel.json            # SPA rewrite -> index.html
│
└── server/                    # Express API -> Vercel serverless
    ├── api/index.js           # Serverless entry point
    ├── server.js              # App assembly + middleware order
    ├── routes/                # Route definitions only
    ├── controllers/           # Request/response handling
    ├── services/              # Business logic, reusable
    ├── models/                # Mongoose schemas
    ├── middleware/auth.js     # JWT verification, role checks
    ├── configs/               # DB connection, mailer
    └── vercel.json            # Rewrite all paths -> /api
```

**Layering rule:** routes → controllers → services → models. Controllers handle
HTTP concerns; services hold logic reusable across entry points. For example
`markBookingPaid()` is called from three different places, so it lives in a
service rather than being duplicated in a controller.

---

## 3. Data Model

Four domain collections plus one infrastructure collection.

```
User ──< Booking >── Show ──> Movie
                                ^
                          ApiCache (infrastructure)
```

### User
```js
{ name, email (unique, lowercase),
  password (bcrypt, select: false),
  googleId (unique, sparse),
  role: "user" | "admin",
  favorites: [movieId] }
```
- `select: false` keeps the hash out of every ordinary query; login must opt in
  with `.select("+password")`.
- `googleId` is `sparse` so multiple password-only users (all `null`) don't
  collide on the unique index.
- Supports both auth methods on one account — signing in with Google links
  `googleId` to an existing email rather than creating a duplicate user.

### Movie
```js
{ _id: imdbID (String),          // natural key from OMDB
  title, overview, genres[], casts[],
  poster_path, poster_candidates[],      // ordered fallbacks
  backdrop_path, backdrop_candidates[],
  trailer_video_id,                      // cached YouTube id
  vote_average, runtime, release_date }
```
Uses the **IMDb ID as the primary key** rather than an ObjectId. It's a stable
natural identifier, so the same film is never stored twice and external lookups
need no translation table.

### Show
```js
{ movie: imdbID (ref),
  showDateTime: Date,
  showPrice: Number,
  occupiedSeats: { "A1": userId, ... }   // minimize: false
}
```
`occupiedSeats` is an object map, not an array — O(1) availability checks
instead of scanning. `{ minimize: false }` stops Mongoose stripping the field
when it's an empty object.

### Booking
```js
{ user, show, amount, bookedSeats[],
  isPaid: Boolean,
  paymentLink, stripeSessionId }
```

### ApiCache
```js
{ _id: cacheKey, value: Mixed,
  expiresAt: Date  // TTL index, MongoDB expires the doc automatically }
```

---

## 4. API Surface

All under `/api`. `protect` = valid JWT; `protectAdmin` = valid JWT + admin role.

### Auth
| Method | Path | Guard | Purpose |
|---|---|---|---|
| POST | `/auth/register` | — | Create account, return JWT |
| POST | `/auth/login` | — | Email + password, return JWT |
| POST | `/auth/google` | — | Verify Google ID token, return JWT |
| GET | `/auth/me` | protect | Current user |

### Shows
| Method | Path | Guard | Purpose |
|---|---|---|---|
| GET | `/show/all` | — | Movies with upcoming showtimes |
| GET | `/show/coming-soon` | — | Upcoming releases not yet scheduled |
| GET | `/show/:movieId` | — | One movie + its showtimes grouped by date |
| GET | `/show/now-playing` | admin | Movie picker source |
| GET | `/show/search` | admin | Title search |
| POST | `/show/add` | admin | Create movie + showtimes |

Route order matters: `/all`, `/coming-soon` and `/search` are declared **before**
`/:movieId`, otherwise the catch-all would swallow them.

### Bookings
| Method | Path | Guard | Purpose |
|---|---|---|---|
| POST | `/booking/create` | protect | Reserve seats, open Stripe session |
| GET | `/booking/seats/:showId` | — | Occupied seats for a show |
| GET | `/booking/confirm/:sessionId` | protect | Verify payment with Stripe |

### User / Admin
`/user/bookings`, `/user/favorites`, `/user/update-favorite`,
`/admin/dashboard`, `/admin/all-shows`, `/admin/all-bookings`, `/admin/is-admin`

### Diagnostics
`GET /api/health` — DB connection state, document counts, and which env vars are
configured (never their values). Deliberately exempt from the DB gate so it can
still report *why* the database is unreachable.

---

## 5. Authentication

### Password flow
1. `register` → validate → bcrypt hash via a `pre("save")` hook → sign JWT (7d)
2. `login` → `.select("+password")` → `bcrypt.compare` → sign JWT
3. Client stores the token in `localStorage`, sends `Authorization: Bearer <jwt>`
4. `protect` middleware verifies and attaches `req.user`

### Google flow
1. Google Identity Services returns an **ID token** in the browser
2. Client posts it to `/auth/google`
3. Server verifies it with `google-auth-library` against `GOOGLE_CLIENT_ID`
4. Find-or-create the user, then issue **our own** JWT

The client never receives a Google session — Google only proves identity once,
after which the app uses its own tokens. That keeps one authorisation model
regardless of how the user signed in.

### Role assignment
`ADMIN_EMAILS` is an env-driven allowlist, re-evaluated **on every login**, not
just at registration. Adding an email to the list promotes that user on their
next sign-in. Promotion only — nobody is silently demoted.

---

## 6. Booking & Payment Flow

The most involved part of the system, because money and inventory must not
disagree.

```
User selects seats
      │
      ▼
POST /booking/create
      │  1. release abandoned holds for this show
      │  2. check seat availability
      │  3. validate total >= Stripe minimum
      │  4. create Booking, mark seats occupied
      │  5. create Stripe Checkout session
      │     └── on failure: roll back (free seats, delete booking)
      ▼
Stripe hosted checkout
      │
      ├── success ──> /loading/my-bookings?session_id=...
      │                    └── GET /booking/confirm/:sessionId
      └── webhook ──> POST /api/stripe
```

### Three independent paths set `isPaid`

| Path | Trigger | Covers |
|---|---|---|
| Stripe webhook | Stripe calls us | User closes the tab; async UPI settlement |
| Return confirmation | User lands back on the site | Instant feedback, no webhook needed |
| Reconciliation | My Bookings loads | Self-healing if both above failed |

All three call one **idempotent** `markBookingPaid()`, so concurrent execution
can't double-process. This redundancy is deliberate: webhooks are the standard
approach but are the easiest thing to misconfigure, and a booking silently
stuck as unpaid is a terrible user experience.

### Seat holds

Seats are reserved the moment a booking is created — before payment. Without
cleanup, an abandoned checkout would hold them forever.

The subtle bug this design avoids: **Stripe's minimum session lifetime is 30
minutes.** With a shorter seat hold, there's a window where seats are released
but the customer's payment page still works — they'd pay for a booking that no
longer exists.

Fix: one value (`SEAT_HOLD_MINUTES`, floored at 30) drives **both** the seat
hold and the Stripe `expires_at`, so they expire together. As a safety net,
the cleanup asks Stripe whether the session is still `open` before releasing.

Cleanup runs **on demand** — when seats are viewed, a booking is created, or My
Bookings loads — rather than on a schedule, so it needs no background worker.

### Ordering matters
On My Bookings, reconciliation runs **before** the abandoned-booking sweep. If
it ran after, a booking that was genuinely paid but not yet marked would be
deleted as "abandoned", destroying a real ticket.

---

## 7. Movie Data Pipeline

External data is unreliable, so every source is optional and degrades.

```
Details / search:  OMDB
Posters:           OMDB ──> Fanart.tv ──> inline placeholder
Trailers:          YouTube Data API (cached per movie, manual override)
```

### Poster resolution returns a list, not a URL
The server collects **all** working poster URLs in priority order, and the
client walks them on `onError`.

The reasoning: the browser loads the image, not the server. If a user's ISP
blocks an image host, the server can still fetch that URL happily — only the
client can detect the failure. A server-side "pick the best one" strategy would
hand out a URL the visitor can never render.

### Image quality
OMDB returns Amazon URLs with an embedded transform chain
(`._V1_QL75_UX380_`) — a 380px, quality-75 render. Rewriting that segment
requests a full-resolution image. Done client-side so already-stored URLs
benefit without a database migration, and sized per use: 1920px for the hero,
640px for cards.

### Caching
A two-layer cache (in-process `Map` in front of a MongoDB TTL collection) makes
cached responses survive restarts — important on serverless, where processes
are recycled constantly and an in-memory-only cache would be near useless.
Trailer IDs are additionally stored on the `Movie` document so each film is
looked up once, ever.

---

## 8. Frontend Architecture

### State
A single `AppContext` holds auth state, the shows list, favourites, and the
configured axios instance. No Redux — the state graph is small and mostly
server-derived.

### Motion system
`components/motion/Reveal.jsx` exports shared easing and variants so every
section animates consistently. Variants are written as **functions of `custom`**
so per-element delays work — a variant's own `transition` overrides the
component's `transition` prop, so the delay has to live inside the variant.

### Scroll-driven movie hero
The details page pins the poster with `position: sticky` inside a tall section,
then drives everything from `useScroll` progress:

```
progress  0.00 - 0.14   title fades out
          0.06 - 0.30   poster dims
          0.12 - 0.30   synopsis fades in
          ...    0.62   poster unpins
```

Every stage completes **before** the pin releases — otherwise the animation
would play against a poster that has already scrolled away.

Two non-obvious problems solved here:
- **An element at `opacity: 0` still receives clicks.** The invisible synopsis
  layer was swallowing clicks meant for the Buy Tickets button, so pointer
  events are toggled from the same scroll value as the fade.
- **Chrome re-composites iframes inside transformed ancestors**, which
  interrupts video playback. The trailer iframe is deliberately rendered
  outside any animated element.

---

## 9. Deployment

Two Vercel projects from one repository:

| Project | Root Directory | Output |
|---|---|---|
| Frontend | `client` | Static build, SPA rewrite to `index.html` |
| API | `server` | Serverless function via `api/index.js` |

### Serverless adaptations
Express normally calls `app.listen()`, which has no meaning in a serverless
runtime. The app is **exported** instead, and only listens when run as a normal
process (`if (!process.env.VERCEL)`), so local development is unchanged.

The database connection is **cached on `globalThis`** so warm invocations reuse
one pool instead of opening a new one per request, and connects lazily on first
use rather than at module load — a serverless function has no startup phase.

CORS is registered before the DB middleware so preflight requests never touch
the database.

---

## 10. Interview Talking Points

Concrete decisions worth being able to defend:

1. **Why three payment-confirmation paths?** Webhooks are correct but the most
   fragile link in the chain. Layering an on-return check and a self-healing
   reconciliation means no single misconfiguration leaves a paid booking
   showing "Pay Now".

2. **Why is the seat hold coupled to the Stripe session?** Because they're the
   same concept — how long we promise a seat. Two independent timers created a
   window where a customer could pay for released seats.

3. **Why do posters resolve to a list rather than one URL?** Because the failure
   happens in the user's browser, not on the server. Only the client can detect
   a blocked image host.

4. **Why the IMDb ID as a primary key?** It's a stable natural key from the
   upstream source, which removes an entire class of duplicate-record and
   ID-mapping bugs.

5. **Why is `occupiedSeats` an object rather than an array?** O(1) lookups when
   checking availability, and it stores who holds each seat in the same
   structure.

6. **Why does on-demand cleanup beat a cron job?** No extra infrastructure, and
   it works identically on a laptop and on serverless. The trade-off is that
   cleanup only happens when someone visits — acceptable because the only
   observer that matters is the next person trying to book those seats.

7. **Why keep background jobs optional?** Emails and reminders shouldn't be able
   to fail a booking. Event sends are wrapped so a missing Inngest key logs a
   warning instead of throwing after the database write has already succeeded.

---

## 11. Known Trade-offs

Being able to name a system's weaknesses is usually more convincing than
claiming it has none.

- **No seat-level locking.** Two users can select the same seat simultaneously;
  the second `create` fails the availability check. A production system would
  use a transaction or an atomic `findOneAndUpdate` on the seat map.
- **Cleanup is visitor-triggered.** If nobody visits, abandoned holds persist.
  A scheduled job would be more predictable.
- **OMDB returns only 3-4 cast members** and no headshots, so the cast row shows
  initials. Richer data needs a different provider.
- **JWT in `localStorage`** is vulnerable to XSS. httpOnly cookies would be
  safer but complicate a cross-origin serverless deployment.
- **No automated tests.** Verification during development was manual plus
  targeted scripts. Payment logic in particular deserves an integration suite.
- **Admin role via env allowlist** doesn't scale beyond a handful of admins; a
  proper permissions table would be the next step.
