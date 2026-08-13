import stripe from "stripe";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { sendEvent } from "../inngest/index.js";

const markBookingPaid = async (bookingId) => {
  if (!bookingId) return;

  const booking = await Booking.findById(bookingId);
  if (!booking || booking.isPaid) return; // already handled

  booking.isPaid = true;
  booking.paymentLink = "";
  await booking.save();

  await sendEvent({ name: "app/show.booked", data: { bookingId } });
  console.log(`[stripe] booking ${bookingId} marked paid`);
};

// Frees the held seats when a payment fails or expires
const releaseBooking = async (bookingId) => {
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
  console.log(`[stripe] booking ${bookingId} released`);
};

export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("[stripe] signature verification failed:", error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    const session = event.data.object;
    const bookingId = session?.metadata?.bookingId;

    switch (event.type) {
      // Cards settle immediately. UPI and other async methods arrive here
      // still unpaid, and confirm later via async_payment_succeeded.
      case "checkout.session.completed": {
        if (session.payment_status === "paid") {
          await markBookingPaid(bookingId);
        } else {
          console.log(`[stripe] ${bookingId} pending async payment`);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        await markBookingPaid(bookingId);
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        await releaseBooking(bookingId);
        break;
      }

      default:
        console.log("[stripe] unhandled event:", event.type);
    }

    response.json({ received: true });
  } catch (error) {
    console.error("[stripe] webhook processing error:", error);
    response.status(500).send("Internal Server Error");
  }
};
