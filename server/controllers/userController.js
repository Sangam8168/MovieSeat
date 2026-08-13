import Movie from "../models/Movie.js";
import Booking from "../models/Booking.js";
import { reconcileBookings } from "../services/reconcile.js";
import {
  releaseBooking,
  stillPayable,
} from "../services/bookingPayment.js";

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

    // Reconcile first: a booking may be paid at Stripe but still marked
    // unpaid here, and it must not be mistaken for an abandoned one.
    await reconcileBookings(bookings);

    // Anything still unpaid past the hold window was abandoned - drop it
    // and free its seats.
    const holdMinutes = Number(process.env.SEAT_HOLD_MINUTES) || 10;
    const cutoff = Date.now() - holdMinutes * 60 * 1000;

    const expired = bookings.filter(
      (b) => !b.isPaid && new Date(b.createdAt).getTime() < cutoff
    );

    // Keep any whose checkout page is still live - the customer can still pay
    const payable = await Promise.all(expired.map(stillPayable));
    const abandoned = expired.filter((_, i) => !payable[i]);

    for (const booking of abandoned) {
      await releaseBooking(booking._id);
    }

    const abandonedIds = new Set(abandoned.map((b) => String(b._id)));
    const active = bookings.filter((b) => !abandonedIds.has(String(b._id)));

    res.json({ success: true, bookings: active });
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
