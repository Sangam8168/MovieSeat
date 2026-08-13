import stripe from "stripe";
import { markBookingPaid } from "./bookingPayment.js";

// Asks Stripe whether any still-unpaid bookings have actually been paid.
// Covers the case where neither the webhook nor the on-return check ran.
export const reconcileBookings = async (bookings, limit = 5) => {
  const pending = bookings
    .filter((b) => !b.isPaid && b.stripeSessionId)
    .slice(0, limit);

  if (pending.length === 0) return bookings;

  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  await Promise.allSettled(
    pending.map(async (booking) => {
      try {
        const session = await stripeInstance.checkout.sessions.retrieve(
          booking.stripeSessionId
        );

        if (session?.payment_status === "paid") {
          await markBookingPaid(booking._id);
          booking.isPaid = true;
          booking.paymentLink = "";
        }
      } catch (error) {
        console.warn(
          `[reconcile] ${booking._id}: ${error.message}`
        );
      }
    })
  );

  return bookings;
};
