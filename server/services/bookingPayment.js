import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { sendEvent } from "../inngest/index.js";

// Shared by the Stripe webhook and the on-return confirmation check.
// Idempotent, so it is safe if both paths run for the same booking.
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
