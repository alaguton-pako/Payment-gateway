import Stripe from "stripe";
import admin from "./firebaseAdmin"; // Import Firebase Admin
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // ✅ Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { email, name, phone, course, stripePriceId } = req.body;

    if (!email || !name || !phone || !course || !stripePriceId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      metadata: { name, phone, course }, // ✅ Store metadata
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: "payment",
      success_url: "https://topteamlimiteddevelopment.netlify.app/training",
      cancel_url: "https://topteamlimiteddevelopment.netlify.app/training",
    });

    // ✅ Save Payment Details to Firebase Firestore
    const db = admin.firestore();
    await db.collection("trainingPayments").doc(session.id).set({
      email,
      name,
      phone,
      course,
      stripePriceId,
      status: "pending",
      paymentIntentId: session.payment_intent, // ✅ Store payment intent ID
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
}
