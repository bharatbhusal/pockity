# 📦 Pockity

Pockity is a **multi-tenant S3 storage orchestration server** that provides each user with secure and quota-controlled storage inside a shared S3 bucket.  
Inspired by Doraemon’s infinite pocket, Pockity aims to give developers a **scalable, API-first cloud storage solution** with flexible tiers, API key management, and crypto-friendly billing.

---

## ✨ Features

- 🔐 **Authentication & User Management**
  - Email/password authentication with JWT tokens
  - Admin approval flow for storage tier selection & upgrades
  - Role-based access control (USER/ADMIN)

- 🔑 **API Key Management**
  - Generate multiple API key pairs per user
  - Secure key storage with bcrypt hashing
  - Keys can be linked to different tiers
  - Revocation & activity tracking

- 📂 **Storage Control**
  - All users share the same S3 bucket
  - Each user is isolated to their own prefix/folder (`users/{userId}/`)
  - Tier-based quotas (storage in GB, object count)
  - Real-time usage tracking (uploads/deletes update quota)
  - Secure file operations with presigned URLs

- 💳 **Flexible Billing**
  - Supports Stripe/Razorpay (fiat payments)
  - Supports crypto (ETH, USDC, BTC) with manual or credit-based renewals
  - Invoices & subscriptions modeled in DB
  - Admin approval for tier upgrades/downgrades

- 📊 **Usage Tracking**
  - Per-user usage in `Usage` model
  - Updated in real-time + reconciled with S3 events
  - Used for billing and quota enforcement

- 🛠 **Admin Dashboard Features**
  - Approve/reject user tier requests
  - Manage subscriptions and billing
  - Monitor usage & invoices
  - View all tiers including private ones

- 🚀 **Developer-Friendly**
  - RESTful API design
  - Comprehensive error handling
  - TypeScript support
  - Modular architecture with services, controllers, and repositories

---

## 🏗 Tech Stack

- **Backend:** Node.js + TypeScript + Express
- **Database:** PostgreSQL + Prisma ORM
- **Storage:** AWS S3 (single bucket, per-user prefixes)
- **Auth:** JWT-based API authentication
- **File Upload:** Multer middleware for multipart/form-data
- **AWS SDK:** @aws-sdk/client-s3 for S3 operations
- **Security:** bcrypt for password/key hashing, CORS protection
- **Validation:** Zod for request validation
- **Payments:** Stripe / Razorpay + Crypto (ETH/USDC/BTC)
- **Future UI:** Next.js (admin + user portal)

---

## 🔒 Security & Data Isolation

Pockity ensures complete data isolation between users through several security measures:

### User Storage Isolation
- Each user's files are stored under a unique prefix: `users/{userId}/`
- All storage operations validate user ownership before allowing access
- Users cannot access or manipulate files belonging to other users
- Presigned URLs are generated with user-specific permissions

### API Key Security
- API keys use a two-part system: `accessKeyId` and `secretKey`
- Secret keys are hashed using bcrypt before storage
- Keys can be revoked instantly and have activity tracking
- Each key can optionally be tied to specific tier permissions

### Admin Controls
- Admin-only endpoints for managing tier requests and approvals
- Role-based middleware ensures only admins can access sensitive operations
- Audit logging for all administrative actions

### Environment Security
- All AWS credentials and sensitive data stored in environment variables
- JWT tokens for secure authentication
- CORS protection with configurable origins

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
AWS_REGION="us-east-1"
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

### Authentication
- `POST /api/auth/register` → User registration
- `POST /api/auth/login` → User login

### API Key Management
- `POST /api/apikeys` → Generate new API key pair
- `GET /api/apikeys` → List user's API keys
- `GET /api/apikeys/:id` → Get specific API key details
- `DELETE /api/apikeys/:id` → Revoke API key

### Storage Operations
- `POST /api/storage/upload` → Upload file with quota enforcement
- `GET /api/storage/files` → List all user's files
- `GET /api/storage/files/:fileName` → Get file download URL
- `DELETE /api/storage/files/:fileName` → Delete file
- `GET /api/storage/usage` → Get storage usage statistics

### Tier Management
- `GET /api/tiers` → List available tiers
- `POST /api/tier-requests` → Request tier upgrade
- `GET /api/tier-requests` → Get user's tier requests

### Admin Operations
- `GET /api/tier-requests/admin/all` → List all tier requests (admin only)
- `PATCH /api/tier-requests/admin/:id/approve` → Approve/reject tier request (admin only)
- `GET /api/tiers/admin/all` → List all tiers including private ones (admin only)

### Public Endpoints
- `GET /api/open/health` → Health check

---

## 📋 API Usage Examples

### Authentication Flow
```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "John Doe"}'

# Login to get JWT token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### API Key Management
```bash
# Create API key (requires JWT token)
curl -X POST http://localhost:8080/api/apikeys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My API Key"}'

# List API keys
curl -X GET http://localhost:8080/api/apikeys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### File Operations
```bash
# Upload a file
curl -X POST http://localhost:8080/api/storage/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/file.txt"

# List user's files
curl -X GET http://localhost:8080/api/storage/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get file download URL
curl -X GET http://localhost:8080/api/storage/files/filename.txt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Delete a file
curl -X DELETE http://localhost:8080/api/storage/files/filename.txt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Tier Management
```bash
# View available tiers
curl -X GET http://localhost:8080/api/tiers

# Request tier upgrade (requires authentication)
curl -X POST http://localhost:8080/api/tier-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tierId": "tier_id_here", "reason": "Need more storage"}'

# Admin: Approve tier request
curl -X PATCH http://localhost:8080/api/tier-requests/admin/REQUEST_ID/approve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

---

## 📜 License

MIT License.  
Built with ❤️ to make infinite storage more accessible.
