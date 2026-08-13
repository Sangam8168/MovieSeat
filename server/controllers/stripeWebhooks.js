import stripe from "stripe";
import { markBookingPaid, releaseBooking } from "../services/bookingPayment.js";

/**
 * Stripe verifies the signature against the exact raw bytes. Locally
 * express.raw() supplies a Buffer, but some serverless runtimes parse the
 * JSON before Express runs, so fall back to whatever raw form is available.
 * Returns null when the body has already been parsed and is unrecoverable.
 */
const getRawBody = (request) => {
  if (Buffer.isBuffer(request.body)) return request.body;
  if (Buffer.isBuffer(request.rawBody)) return request.rawBody;
  if (typeof request.rawBody === "string") return Buffer.from(request.rawBody);
  if (typeof request.body === "string") return Buffer.from(request.body);
  return null;
};

export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not set");
    return response.status(500).send("Webhook secret not configured");
  }

  const rawBody = getRawBody(request);
  if (!rawBody) {
    console.error(
      "[stripe] raw body unavailable - the platform parsed it before Express. " +
        "Signature cannot be verified."
    );
    return response.status(400).send("Webhook Error: raw body unavailable");
  }

  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      rawBody,
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
