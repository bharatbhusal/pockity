# 📦 Pockity

Pockity is a **multi-tenant S3 storage orchestration server** that provides each user with secure and quota-controlled storage inside a shared S3 bucket.  
Inspired by Doraemon’s infinite pocket, Pockity aims to give developers a **scalable, API-first cloud storage solution** with flexible tiers, API key management, and crypto-friendly billing.

---

## ✨ Features

- 🔐 **Authentication & User Management**
  - Email/password or OAuth login
  - Admin approval flow for storage tier selection & upgrades

- 🔑 **API Key Management**
  - Generate multiple API key pairs per user
  - Keys can be linked to different tiers
  - Revocation & activity tracking

- 📂 **Storage Control**
  - All users share the same S3 bucket
  - Each user is isolated to their own prefix/folder
  - Tier-based quotas (storage in GB, object count)
  - Real-time usage tracking (uploads/deletes update quota)

- 💳 **Flexible Billing**
  - Supports Stripe/Razorpay (fiat payments)
  - Supports crypto (ETH, USDC, BTC) with manual or credit-based renewals
  - Invoices & subscriptions modeled in DB
  - Admin approval for tier upgrades/downgrades

- 📊 **Usage Tracking**
  - Per-user usage in `Usage` model
  - Updated in real-time + reconciled with S3 events
  - Used for billing and quota enforcement

- 🛠 **Admin Dashboard (planned in Next.js)**
  - Approve user tier requests
  - Manage subscriptions
  - Monitor usage & invoices

---

## 🏗 Tech Stack

- **Backend:** Node.js + TypeScript + Express
- **Database:** PostgreSQL + Prisma ORM
- **Storage:** AWS S3 (single bucket, per-user prefixes)
- **Auth:** JWT-based API authentication
- **Payments:** Stripe / Razorpay + Crypto (ETH/USDC/BTC)
- **Future UI:** Next.js (admin + user portal)

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/bharatbhusal/pockity.git
cd pockity
npm install
```

### 2. Setup Environment

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pockity"
JWT_SECRET="super-secret-key"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
S3_BUCKET="your-shared-bucket"
STRIPE_SECRET_KEY="..."
RAZORPAY_KEY_ID="..."
RAZORPAY_SECRET="..."
```

### 3. Run Database Migrations

```bash
npm run prisma:migrate:dev
```

### 4. Start the Server

```bash
npm run dev
```

---

## 📡 API Overview

- **Auth**
  - `POST /auth/register`
  - `POST /auth/login`

- **API Keys**
  - `POST /apikeys` → generate key
  - `DELETE /apikeys/:id` → revoke key

- **Storage**
  - `POST /storage/upload` → upload with quota enforcement
  - `DELETE /storage/:key` → delete file
  - `GET /storage/usage` → get usage stats

- **Tiers & Subscription**
  - `GET /tiers`
  - `POST /tiers/request` → request upgrade
  - `POST /subscriptions/pay` → pay invoice (fiat/crypto)

---

## 📜 License

MIT License.  
Built with ❤️ to make infinite storage more accessible.
