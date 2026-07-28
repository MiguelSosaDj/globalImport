import Stripe from "stripe";

export function createStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Falta STRIPE_SECRET_KEY");
  }

  return new Stripe(stripeSecretKey);
}
