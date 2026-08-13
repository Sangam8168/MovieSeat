# 🎬 MovieSeat - Movie Ticket Booking System

## 🌐 Live Demo: [https://movie-seat-one.vercel.app/)

![MovieSeat Banner](https://raw.githubusercontent.com/maliha-yasmin-mim/SHOWTIME/main/Project_Screenshots/User_pages_image/01-Home_page/01-homepage.png)

## 📋 Overview
**MovieSeat** is a full-featured, production-ready movie ticket booking platform built with the MERN stack. This application allows users to browse movies, select seats, book tickets, and make payments seamlessly. 

**For administrators**, the platform includes a comprehensive dashboard to manage shows, track bookings, monitor revenue, and oversee the entire ticketing system with real-time analytics and control.

## ✨ Features

### 🎫 User Features
- ✅ Browse latest movies with real-time data from TMDB
- ✅ View movie details, cast, trailers, and showtimes
- ✅ Interactive seat selection with real-time availability
- ✅ Secure booking with Stripe payment integration
- ✅ Favorite movies system
- ✅ Booking history and management
- ✅ Email notifications for bookings and reminders
- ✅ Responsive design for all devices

### 👑 Admin Features
- 📊 Dashboard with analytics (revenue, bookings, users)
- 🎬 Add new movie shows with TMDB integration
- 📋 Manage all shows and bookings
- 👥 View user statistics
- 🔐 Role-based access control

### ⚙️ System Features
- 🔄 Automated seat release for unpaid bookings
- 📧 Automated email notifications (booking confirmations, reminders)
- 🕐 Background job processing with Inngest
- 🔐 Secure JWT-based authentication (email + password, or Sign in with Google)
- 💳 Secure payment processing with Stripe
- 🎥 Real movie data from TMDB API

## 🖼️ Screenshots
## ✨User Pages

### Home Page
![Home Page](https://raw.githubusercontent.com/maliha-yasmin-mim/SHOWTIME/main/Project_Screenshots/User_pages_image/01-Home_page/01-homepage.png)

### Trailer Section
![Trailer Section](https://github.com/maliha-yasmin-mim/SHOWTIME/blob/main/Project_Screenshots/User_pages_image/01-Home_page/03-homepage.png?raw=true)

### Movies Page
![Movies Page](https://raw.githubusercontent.com/maliha-yasmin-mim/SHOWTIME/main/Project_Screenshots/User_pages_image/02-Buy_Tickets/01-Select_movie_from_movies_page.png)

### Movie Details
![Movie Details](<https://raw.githubusercontent.com/maliha-yasmin-mim/SHOWTIME/main/Project_Screenshots/User_pages_image/02-Buy_Tickets/02-Movie_details(click_buy_now).png>)

### Seat Selection
![Seat Selection](https://raw.githubusercontent.com/maliha-yasmin-mim/SHOWTIME/main/Project_Screenshots/User_pages_image/02-Buy_Tickets/04-Select_time_and_seats.png)

### Payment
![Payment](https://raw.githubusercontent.com/maliha-yasmin-mim/SHOWTIME/main/Project_Screenshots/User_pages_image/02-Buy_Tickets/05-Payment_page.png)

### My Bookings
![My Bookings](https://github.com/maliha-yasmin-mim/SHOWTIME/blob/main/Project_Screenshots/User_pages_image/03-My_bookings_page/01-My_bookings_page.png?raw=true)

## ✨Admin Pages

### Admin Dashboard
![Admin Dashboard](https://github.com/maliha-yasmin-mim/SHOWTIME/blob/main/Project_Screenshots/Admin_pages_image/01-Dashboard/01-Dashboard.png?raw=true)


### Admin - Add Shows
![Add Shows](https://github.com/maliha-yasmin-mim/SHOWTIME/blob/main/Project_Screenshots/Admin_pages_image/02-Add_Shows/03-To_add_shows(select%20movie%20%2B%20set%20times%20and%20price).png?raw=true)

### Admin - List Shows
![List Shows](https://github.com/maliha-yasmin-mim/SHOWTIME/blob/main/Project_Screenshots/Admin_pages_image/03-LIst_Shows/01-List_shows_page.png?raw=true)

### Admin - List Bookings
![List Bookings](https://github.com/maliha-yasmin-mim/SHOWTIME/blob/main/Project_Screenshots/Admin_pages_image/04-List_Bookings/01-List_of_all_booking.png?raw=true)

## 🛠️ Technology Stack

### Frontend
- **React** - UI Library
- **Tailwind CSS** - Styling Framework
- **React Router** - Navigation
- **JWT + bcrypt + Google Sign-In** - Authentication
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Stripe** - Payment Processing
- **TMDB API** - Movie Database
- **Inngest** - Background Jobs
- **Nodemailer** - Email Service
- **JWT + bcrypt** - Authentication

## 📁 Project Structure

```
movieseat/
│
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Global state management
│   │   ├── assets/        # Images and assets
│   │   ├── lib/           # Utility functions
│   │   └── App.jsx        # Main app component
│   │
│   └── package.json
│
└── server/                # Node.js Backend
    ├── controllers/       # Business logic
    ├── models/           # Database schemas
    ├── routes/           # API routes
    ├── middleware/       # Authentication middleware
    ├── configs/         # Configuration files
    ├── inngest/         # Background jobs
    └── server.js        # Server entry point
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Stripe account
- TMDB API key

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file and add your credentials
cp .env.example .env

# Edit .env file with your keys
# MONGODB_URI=your_mongodb_uri
# JWT_SECRET=your_jwt_secret
# ADMIN_EMAILS=admin@example.com
# TMDB_API_KEY=your_tmdb_api_key
# STRIPE_SECRET_KEY=your_stripe_secret_key
# etc...

# Start the server
npm run dev
```

### Frontend Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file

# VITE_BASE_URL=http://localhost:3000
# VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
# VITE_CURRENCY=USD
# VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Start the development server
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_EMAILS=admin@example.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
TMDB_API_KEY=your_tmdb_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SMTP_USER=your_brevo_smtp_user
SMTP_PASS=your_brevo_smtp_password
SENDER_EMAIL=your_sender_email
```

### Frontend (.env)
```env
VITE_BASE_URL=http://localhost:3000
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
VITE_CURRENCY=USD
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

### 🔑 Google Sign-In setup
1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** of type **Web application**.
2. Under **Authorised JavaScript origins** add your frontend origins, e.g. `http://localhost:5173` and your production domain.
3. Copy the generated Client ID into **both** `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (client) - they must match, or token verification will fail.

No client *secret* is needed: the browser obtains a Google ID token, and the server verifies it directly with Google before issuing its own JWT.

## 📚 API Endpoints

### Auth Routes
- `POST /api/auth/register` - Create an account (name, email, password)
- `POST /api/auth/login` - Log in with email + password
- `POST /api/auth/google` - Log in / sign up with a Google ID token
- `GET /api/auth/me` - Get the currently logged-in user

### Show Routes
- `GET /api/show/all` - Get all shows
- `GET /api/show/:movieId` - Get specific show
- `GET /api/show/now-playing` - Get now playing movies (Admin)
- `POST /api/show/add` - Add new show (Admin)

### Booking Routes
- `POST /api/booking/create` - Create booking
- `GET /api/booking/seats/:showId` - Get occupied seats

### User Routes
- `GET /api/user/bookings` - Get user bookings
- `GET /api/user/favorites` - Get user favorites
- `POST /api/user/update-favorite` - Update favorites

### Admin Routes
- `GET /api/admin/is-admin` - Check admin status
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/all-shows` - Get all shows
- `GET /api/admin/all-bookings` - Get all bookings

## 🎯 Key Features Implementation

### Real-time Seat Availability
- Seats are marked as occupied instantly upon selection
- Automatic release after 10 minutes if payment not completed
- Real-time updates across all users

### Payment Integration
- Stripe Checkout for secure payments
- Webhook handling for payment verification
- Automated booking confirmation

### Email System
- Booking confirmation emails
- Payment reminder emails
- Show reminder emails (8 hours before)
- New show notification emails

### Background Jobs
- Automated seat cleanup
- Email scheduling
- Custom JWT authentication with role-based admin access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👩‍💻 Developer

**Maliha Yasmin Mim**  
- Full Stack Developer  
- MERN Stack Specialist  
- Passionate about building scalable web applications  

📧 Email: malihayasmin01.official@gmail.com  
🐙 GitHub: [github.com/malihayasminmim](https://github.com/maliha-yasmin-mim)


**Sanjana Afroj Faria**  
- Full Stack Developer  
- MERN Stack Specialist  
- Passionate about building scalable web applications  


📧 Email: malihayasmin01.official@gmail.com  


## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for movie data API
- [Stripe](https://stripe.com/) for payment processing
- [Inngest](https://www.inngest.com/) for background jobs
- [Brevo](https://www.brevo.com/) for email service

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Backend (Railway/Render)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy the application

### Database (MongoDB Atlas)
1. Create a free cluster
2. Whitelist IP addresses
3. Get connection string

---

**Happy Coding!** 🎬🍿

```
