import express from "express";
import mongoose from "mongoose";
import Movie from "./models/Movie.js";
import Show from "./models/Show.js";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";




const app = express();
const port = 3000;

// Serverless has no startup phase, so the connection is established (and
// cached) on the first request that needs it.
// CORS first, so preflight requests never touch the database
app.use(cors());

app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(503).json({
      success: false,
      message:
        "Database unavailable. Check MONGODB_URI and that your host's IP is " +
        "allowed in MongoDB Atlas (Network Access).",
    });
  }
});

app.use(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);
 

// Middleware
app.use(express.json());



// API Routes
app.get("/", (req, res) => res.send("Server is Live and best!"));

// Diagnostics. Reports whether keys are set, never their values.
app.get("/api/health", async (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const googleId = process.env.GOOGLE_CLIENT_ID || "";
  const connected = mongoose.connection.readyState === 1;

  let data = null;
  if (connected) {
    try {
      const now = new Date();
      const [movies, shows, upcoming] = await Promise.all([
        Movie.countDocuments(),
        Show.countDocuments(),
        Show.countDocuments({ showDateTime: { $gte: now } }),
      ]);
      const next = await Show.findOne({ showDateTime: { $gte: now } })
        .sort({ showDateTime: 1 })
        .select("showDateTime");

      data = {
        movies,
        shows,
        upcomingShows: upcoming,
        pastShows: shows - upcoming,
        nextShowtime: next?.showDateTime ?? null,
        serverTime: now,
        hint:
          movies === 0
            ? "No movies saved yet - add one from Admin > Add Shows."
            : upcoming === 0
            ? "Movies exist but every showtime is in the past, so the Movies page will look empty. Add a future showtime."
            : "Data looks good - the Movies page should list movies.",
      };
    } catch (error) {
      data = { error: error.message };
    }
  }

  res.json({
    success: true,
    database: {
      state: states[mongoose.connection.readyState] ?? "unknown",
      name: mongoose.connection.name || null,
    },
    data,
    env: {
      JWT_SECRET: Boolean(process.env.JWT_SECRET),
      MONGODB_URI: Boolean(process.env.MONGODB_URI),
      OMDB_API_KEY: Boolean(process.env.OMDB_API_KEY),
      FANART_API_KEY: Boolean(process.env.FANART_API_KEY),
      YOUTUBE_API_KEY: Boolean(process.env.YOUTUBE_API_KEY),
      INNGEST_EVENT_KEY: Boolean(process.env.INNGEST_EVENT_KEY),
      GOOGLE_CLIENT_ID: googleId
        ? googleId.endsWith(".apps.googleusercontent.com")
          ? "ok"
          : "set but not a valid client ID (did you paste the client secret?)"
        : "missing",
    },
  });
});
// app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/auth", authRouter)
app.use("/api/show", showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)
 

// Vercel imports the app and handles the HTTP layer itself; only listen
// when running as a normal process.
if (!process.env.VERCEL) {
  app.listen(port, () =>
    console.log(`Server listening at http://localhost:${port}`)
  );
}

export default app;
