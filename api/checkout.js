import Stripe from "stripe";
import admin from "./firebaseAdmin"; // Import Firebase Admin
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { email, name, stripePriceId } = req.body;

    if (!email || !name || !stripePriceId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      metadata: { name },
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: "payment",
      success_url: "https://www.topteamlimited.com/training",
      cancel_url: "https://www.topteamlimited.com/training",
    });

    // ✅ Save Payment Intent to Firebase Firestore
    const db = admin.firestore();
    await db.collection("trainingPayments").doc(session.id).set({
      email,
      name,
      stripePriceId,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
}
// This code snippet creates a new Stripe Checkout session using the Stripe API. The required fields are extracted from the request body, and the session is created with the specified payment method types, customer email, metadata, line items, and success and cancel URLs. The session URL is then returned in the response.
