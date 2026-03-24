# 🎬 media-share

> **Streamlabs Media Share — but for Indian streamers.**  
> Let your viewers donate via UPI, debit/credit card, or net banking and instantly queue a YouTube video on your live stream.

---

## What is this?

**media-share** is a self-hosted, open-source alternative to Streamlabs Media Share, built specifically for **Indian content creators**. Streamlabs only accepts USD payments through international cards — this project integrates **Razorpay**, giving Indian viewers full access to:

- 🏦 UPI (GPay, PhonePe, Paytm, etc.)
- 💳 Indian debit & credit cards
- 🌐 Net banking

A viewer pays ₹30, submits a YouTube link, and it **instantly plays on the streamer's stream** as a browser source overlay — no third-party dashboard, no currency conversion, no hassle.

---

## How It Works

```
Viewer → pay.html → Razorpay Checkout → Server verifies payment
                                             ↓
                                    Queue video in memory
                                             ↓
                               WebSocket push → overlay.html
                                             ↓
                              YouTube video plays for 30 seconds
                                             ↓
                                    Next video in queue
```

---

## Features

- ✅ **Razorpay Integration** — UPI, cards, net banking, wallets
- ✅ **Real-time WebSocket Queue** — videos play instantly after payment verification
- ✅ **OBS Browser Source Ready** — `overlay.html` works as a drop-in browser source
- ✅ **Payment Verification** — HMAC-SHA256 signature verification on every transaction
- ✅ **Admin Panel** — manually queue videos without payment (for testing or gifting slots)
- ✅ **Auto-reconnect WebSocket** — overlay reconnects automatically if connection drops
- ✅ **Keep-alive logic** — prevents YouTube iframe from going idle mid-stream
- ✅ **Supports YouTube Shorts & standard links**

---

## Project Structure

```
media-share/
├── server.js          # Express + WebSocket server, Razorpay order creation & verification
├── pay.html           # Viewer-facing payment page
├── overlay.html       # OBS browser source — plays queued videos via WebSocket
├── admin.html         # Streamer admin panel — manually play videos
├── alert.html         # Donation alert overlay
├── thankyou.html      # Post-payment confirmation page
└── package.json
```

---

## Setup

### Prerequisites

- Node.js v18+
- A [Razorpay](https://razorpay.com) account (test keys work fine for development)

### 1. Clone & Install

```bash
git clone https://github.com/hey-raghav/media-share.git
cd media-share
npm install
```

### 2. Configure Environment

Create a `.env` file in the root:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

Also update `pay.html` to use your Razorpay Key ID:

```js
key: "rzp_test_xxxxxxxxxxxx",  // line ~95 in pay.html
```

### 3. Run the Server

```bash
node server.js
```

Server starts at `http://localhost:3000` by default.

---

## OBS Setup (For Streamers)

1. In OBS, add a **Browser Source**
2. Set the URL to `http://localhost:3000/overlay.html` (or your hosted URL)
3. Set width/height to match your canvas (e.g. 1920×1080)
4. Check **"Shutdown source when not visible"** — optional but recommended

Share `http://your-server/pay.html` with your viewers. That's it.

---

## Pages Overview

| Page | Who uses it | What it does |
|---|---|---|
| `/pay.html` | Viewers | Submit name + YouTube link, pay ₹30 via Razorpay |
| `/overlay.html` | OBS (browser source) | Plays queued videos in real-time via WebSocket |
| `/admin.html` | Streamer | Manually queue any video without payment |
| `/alert.html` | OBS (browser source) | Shows donation alert when a video is queued |
| `/thankyou.html` | Viewers | Confirmation screen after successful payment |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/create-order` | Creates a Razorpay order (₹30) |
| `POST` | `/verify-payment` | Verifies HMAC signature, adds video to queue |
| `POST` | `/admin-play` | Admin bypass — directly queues a video |
| `POST` | `/next` | Pops the current video, plays next in queue |

---

## vs. Streamlabs Media Share

| Feature | Streamlabs | media-share |
|---|---|---|
| Payment | USD only (international cards) | ₹ INR — UPI, cards, net banking |
| Hosting | Cloud (their servers) | Self-hosted |
| Cost | Subscription | Free & open source |
| Customization | Limited | Full control |
| India-friendly | ❌ | ✅ |

---

## Tech Stack

- **Backend** — Node.js, Express 5, `ws` (WebSocket)
- **Payments** — Razorpay SDK
- **Frontend** — Vanilla HTML/CSS/JS
- **Video** — YouTube IFrame API

---

## Security Notes

- Payment signatures are verified server-side using `crypto` (HMAC-SHA256) before any video is queued
- Razorpay test keys are safe for development — switch to live keys before going live
- The admin panel (`/admin.html`) has no authentication — **do not expose it publicly in production**

---

## Contributing

PRs and issues welcome. Some ideas for contributions:

- [ ] Persistent queue (survive server restarts)
- [ ] Configurable donation amount
- [ ] Streamer dashboard with queue management
- [ ] Block/skip functionality
- [ ] Multiple streamer support

### Security Improvements (Known Issues)

- [ ] **Admin panel has no authentication** — anyone who knows `/admin.html` can queue videos for free. Needs at minimum a password prompt or IP allowlist before public deployment
- [ ] **Razorpay Key ID is hardcoded in `pay.html`** — should be injected server-side via a `/config` endpoint or templating, so it never lives in source code
- [ ] **No rate limiting** on `/create-order` — a bad actor could spam order creation without paying. Add rate limiting (e.g. `express-rate-limit`) per IP
- [ ] **Queue is in-memory only** — a server crash silently drops all pending videos with no refund mechanism

---

## License

ISC

---

**Built by [Raghav](https://heyraghav.in)**
