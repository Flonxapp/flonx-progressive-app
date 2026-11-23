import { loadStripe } from "@stripe/stripe-js";

// Publishable key from the environment (pk_live_… in production). It must
// belong to the same Stripe account and mode as the backend's secret key.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Every payment (new card, saved card, tip) ends on the result page, which
// asks Stripe for the real outcome and handles 3D Secure if needed.
export const paymentResultPath = (clientSecret, purpose = "order") =>
  `/checkout/payment_successfull?payment_intent_client_secret=${encodeURIComponent(
    clientSecret,
  )}&for=${purpose}`;
