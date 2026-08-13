import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { sendEvent } from "../inngest/index.js";

// Idempotent: safe to call from both the webhook and the return check.
export const markBookingPaid = async (bookingId) => {
  if (!bookingId) return false;

  const booking = await Booking.findById(bookingId);
  if (!booking) return false;
  if (booking.isPaid) return true;

  booking.isPaid = true;
  booking.paymentLink = "";
  await booking.save();

  await sendEvent({ name: "app/show.booked", data: { bookingId } });
  console.log(`[payment] booking ${bookingId} marked paid`);
  return true;
};

// Frees the held seats when a payment fails or expires
export const releaseBooking = async (bookingId) => {
  if (!bookingId) return;

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.isPaid) return;

  const show = await Show.findById(booking.show);
  if (show) {
    booking.bookedSeats.forEach((seat) => {
      delete show.occupiedSeats[seat];
    });
    show.markModified("occupiedSeats");
    await show.save();
  }

  await Booking.findByIdAndDelete(bookingId);
  console.log(`[payment] booking ${bookingId} released`);
};

// Seats are held the moment a booking is created. If the payment is never
// completed, this frees them again. Runs on demand rather than on a schedule,
// so it works without Inngest or a working webhook.
const HOLD_MINUTES = Number(process.env.SEAT_HOLD_MINUTES) || 10;

export const releaseStaleBookings = async (showId) => {
  const cutoff = new Date(Date.now() - HOLD_MINUTES * 60 * 1000);

  const stale = await Booking.find({
    show: showId,
    isPaid: false,
    createdAt: { $lt: cutoff },
  });

  if (stale.length === 0) return 0;

  const show = await Show.findById(showId);
  if (show) {
    stale.forEach((booking) => {
      booking.bookedSeats.forEach((seat) => {
        delete show.occupiedSeats[seat];
      });
    });
    show.markModified("occupiedSeats");
    await show.save();
  }

  await Booking.deleteMany({ _id: { $in: stale.map((b) => b._id) } });
  console.log(`[payment] released ${stale.length} stale booking(s) for show ${showId}`);
  return stale.length;
};
