import { sendEvent } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import stripe from "stripe";


// Function to check availability of selected seats for a movie
const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats;

    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

export const createBooking = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { showId, selectedSeats } = req.body;
    const { origin } = req.headers;

    // Check if the seat is available for the selected show
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected Seats are not available.",
      });
    }

    // Get the show details
    const showData = await Show.findById(showId).populate("movie");

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    // Checked before anything is written, so no rollback is needed
    const amount = showData.showPrice * selectedSeats.length;
    const minCharge = Number(process.env.MIN_SHOW_PRICE) || 50;

    if (amount < minCharge) {
      return res.json({
        success: false,
        message: `Total must be at least ${minCharge}. This show is priced too low for online payment.`,
      });
    }

    // Create a new booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount,
      bookedSeats: selectedSeats,
    });

    selectedSeats.map((seat) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");

    await showData.save();

    // Stripe can reject the session (unsupported currency, bad key, amount
    // below the minimum). The booking and seat hold already exist by now, so
    // undo both rather than leaving the seats locked for the next attempt.
    let session;
    try {
      const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

      session = await stripeInstance.checkout.sessions.create({
        success_url: `${origin}/loading/my-bookings`,
        cancel_url: `${origin}/my-bookings`,
        mode: "payment",
        line_items: [
          {
            price_data: {
              // Stripe expects the smallest unit, so INR amounts are in paise
              currency: process.env.CURRENCY || "inr",
              product_data: { name: showData.movie.title },
              unit_amount: Math.round(booking.amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: { bookingId: booking._id.toString() },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      });
    } catch (stripeError) {
      console.error("Stripe checkout failed:", stripeError.message);

      selectedSeats.forEach((seat) => {
        delete showData.occupiedSeats[seat];
      });
      showData.markModified("occupiedSeats");
      await showData.save();
      await Booking.findByIdAndDelete(booking._id);

      return res.json({
        success: false,
        message: `Payment setup failed: ${stripeError.message}`,
      });
    }

    booking.paymentLink = session.url;
    await booking.save();

    await sendEvent({
      name: "app/checkpayment",
      data: { bookingId: booking._id.toString() },
    });

   res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("createBooking:", error);
    res.json({ success: false, message: error.message });
  }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    const occupiedSeats = Object.keys(showData.occupiedSeats);

    res.json({ success: true, occupiedSeats });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
