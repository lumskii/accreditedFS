import Stripe from "stripe";
import* as admin from "firebase-admin";

export const config = {
  api: {
    bodyParser: false, // Needed for raw body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//Initialize Friebase Admin only once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.VITE_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();

export default async function handler(req, res) {
    if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
    }

  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buf = Buffer.concat(chunks);

    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Extract useful info
    const record = {
      email: session.customer_email,
      amount_total: session.amount_total / 100, // convert cents to $
      currency: session.currency,
      plan: session.metadata?.plan || "unknown",
      mode: session.mode,
      status: "paid",
      createdAt: Date.now(),
    };

    try {
      await db.ref("payments").push(record);
      console.log("✅ Payment saved to Realtime DB:", record);
    } catch (dbErr) {
      console.error("❌ Failed to save payment:", dbErr);
    }
  }

  res.json({ received: true });
}