import Movie from "../models/Movie.js";
import Booking from "../models/Booking.js";
import { reconcileBookings } from "../services/reconcile.js";

// API Controller Function to Get User Bookings
export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;

    const bookings = await Booking.find({ user })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    // A booking can be paid at Stripe but still marked unpaid here if the
    // webhook never arrived, so verify any that are still outstanding.
    await reconcileBookings(bookings);

    res.json({ success: true, bookings });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API Controller Function to Update Favorite Movies in the User's Document
export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const user = req.user;

    const index = user.favorites.indexOf(movieId);

    if (index === -1) {
      user.favorites.push(movieId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();

    res.json({ success: true, message: "Favorite movies updated" });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API Controller Function to Get Favorite Movies from the User's Document
export const getFavorites = async (req, res) => {
  try {
    const favorites = req.user.favorites;

    // Getting movies from database
    const movies = await Movie.find({ _id: { $in: favorites } });

    res.json({ success: true, movies });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};
