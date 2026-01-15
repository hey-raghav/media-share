require("dotenv").config(); // MUST BE FIRST

const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

/* ===== CONFIG ===== */
const PORT = process.env.PORT || 3000;
const PRICE = 3000; // ₹30 in paise

/* ===== RAZORPAY INIT ===== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ===== VIDEO QUEUE ===== */
let queue = [];

/* ===== UTILS ===== */
function isValidId(id) {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/* ===== CREATE PAYMENT ORDER ===== */
app.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: PRICE,
      currency: "INR",
      receipt: "video_" + Date.now()
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Payment service unavailable" });
  }
});

/* ===== VERIFY PAYMENT & ACCEPT VIDEO ===== */
app.post("/verify-payment", (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    videoId
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  if (!isValidId(videoId)) {
    return res.status(400).json({ error: "Invalid YouTube ID" });
  }

  // Last payment always wins
  queue = [videoId];
  broadcastQueue();

  res.json({ success: true });
});

/* ===== CLEAR QUEUE AFTER PLAY ===== */
app.post("/next", (req, res) => {
  queue = [];
  broadcastQueue();
  res.json({ success: true });
});

/* ===== SERVER START ===== */
const server = app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});

/* ===== WEBSOCKET ===== */
const wss = new WebSocket.Server({ server });

function broadcastQueue() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(queue));
    }
  });
}
