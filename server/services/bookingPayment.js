import stripe from "stripe";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { sendEvent } from "../inngest/index.js";

// Idempotent: safe to call from both the webhook and the return check.
export const markBookingPaid = async (bookingId) => {
  if (!bookingId) return false;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    // The customer paid but the booking is gone - it was released while their
    // checkout session was still open. Needs manual follow-up.
    console.error(
      `[payment] PAID BUT MISSING: booking ${bookingId} no longer exists`
    );
    return false;
  }
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

export const sessionIdFor = (booking) =>
  booking.stripeSessionId ||
  (String(booking.paymentLink || "").match(/(cs_(?:test|live)_[A-Za-z0-9]+)/) ||
    [])[1] ||
  null;

// A session that is still "open" can still be paid, so its seats must stay
// held even past the hold window - otherwise the customer pays for a booking
// that no longer exists.
export const stillPayable = async (booking) => {
  const id = sessionIdFor(booking);
  if (!id) return false;

  try {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(id);
    return session?.status === "open";
  } catch {
    return false;
  }
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

  // Skip any whose checkout page is still live
  const payable = await Promise.all(stale.map(stillPayable));
  const releasable = stale.filter((_, i) => !payable[i]);
  if (releasable.length === 0) return 0;

  const show = await Show.findById(showId);
  if (show) {
    releasable.forEach((booking) => {
      booking.bookedSeats.forEach((seat) => {
        delete show.occupiedSeats[seat];
      });
    });
    show.markModified("occupiedSeats");
    await show.save();
  }

  await Booking.deleteMany({ _id: { $in: releasable.map((b) => b._id) } });
  console.log(
    `[payment] released ${releasable.length} stale booking(s) for show ${showId}`
  );
  return releasable.length;
};
