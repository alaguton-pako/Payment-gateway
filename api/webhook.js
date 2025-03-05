import Stripe from "stripe";
import dotenv from "dotenv";
import { buffer } from "micro";
import admin from "./firebaseAdmin";

dotenv.config(); // Load environment variables

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Set this in your .env file

export const config = { api: { bodyParser: false } }; // Required for Stripe Webhooks

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  let event;

  try {
    const sig = req.headers["stripe-signature"];
    const rawBody = await buffer(req);

    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Log the event type to check if Stripe is sending requests
  console.log(`Received event: ${event.type}`);

  res.status(200).json({ received: true });
}
