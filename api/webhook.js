import Stripe from "stripe";
import dotenv from "dotenv";
import { buffer } from "micro";
import admin from "./firebaseAdmin";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

  console.log(`Received event: ${event.type}`); // ✅ Log event type

  const session = event.data.object;
  const db = admin.firestore();

  try {
    if (event.type === "checkout.session.completed") {
      // ✅ Check if payment was successful
      if (session.payment_status === "paid") {
        await db.collection("trainingPayments").doc(session.id).update({
          status: "completed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Payment completed: ${session.id}`);
      } else {
        // Handle unpaid sessions (e.g., SEPA debit)
        await db.collection("trainingPayments").doc(session.id).update({
          status: "unpaid",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`⚠️ Payment unpaid: ${session.id}`);
      }
    } else if (event.type === "checkout.session.expired") {
      // ✅ Payment session expired → Update status to "expired"
      await db.collection("trainingPayments").doc(session.id).update({
        status: "expired",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`⚠️ Payment expired: ${session.id}`);
    } else if (event.type === "checkout.session.async_payment_failed") {
      // ✅ Handle asynchronous payment failures (e.g., SEPA)
      await db.collection("trainingPayments").doc(session.id).update({
        status: "failed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`❌ Payment failed: ${session.id}`);
    } else if (event.type === "payment_intent.payment_failed") {
      // ✅ Handle payment intent failures by querying Firestore
      const paymentIntent = event.data.object;
      const snapshot = await db
        .collection("trainingPayments")
        .where("paymentIntentId", "==", paymentIntent.id)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        await doc.ref.update({
          status: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`❌ Payment failed: ${paymentIntent.id}`);
      }
    }
  } catch (error) {
    console.error("❌ Error updating Firestore:", error);
    return res.status(500).send("Error updating Firestore.");
  }

  res.status(200).json({ received: true });
}
