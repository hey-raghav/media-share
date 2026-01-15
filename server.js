require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const PRICE = 3000; // ₹30

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

let queue = [];

function isValidId(id) {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/* Create Razorpay order */
app.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: PRICE,
      currency: "INR",
      receipt: "video_" + Date.now()
    });
    res.json(order);
  } catch {
    res.status(500).json({ error: "Payment error" });
  }
});

/* Verify payment */
app.post("/verify-payment", (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    videoId,
    name
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature)
    return res.status(400).json({ error: "Verification failed" });

  if (!isValidId(videoId) || !name)
    return res.status(400).json({ error: "Invalid input" });

  queue = [{ videoId, name }];
  broadcast();

  res.json({ success: true });
});

/* Clear after play */
app.post("/next", (req, res) => {
  queue = [];
  broadcast();
  res.json({ success: true });
});

const server = app.listen(PORT, () =>
  console.log(`Running on http://127.0.0.1:${PORT}`)
);

const wss = new WebSocket.Server({ server });

function broadcast() {
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify(queue));
    }
  });
}
