# 📦 Pockity

Pockity is a **multi-tenant S3 storage orchestration server** that provides each user with secure and quota-controlled storage inside a shared S3 bucket.  
Inspired by Doraemon’s infinite pocket, Pockity aims to give developers a **scalable, API-first cloud storage solution** with flexible tiers, API key management, and crypto-friendly billing.

---

## ✨ Features

- 🔐 **Authentication & User Management**
  - Email/password authentication with JWT tokens
  - Complete user profile management (update profile, change password, account deletion)
  - Admin approval flow for storage tier selection & upgrades
  - Role-based access control (USER/ADMIN)
  - Comprehensive account summary with usage and billing info
  - **NEW:** Comprehensive audit logging for all critical user events

- 🔑 **API Key Management**
  - Generate multiple API key pairs per user
  - Secure key storage with bcrypt hashing
  - Keys can be linked to different tiers
  - Revocation & activity tracking
  - **NEW:** Automatic S3 folder creation for complete isolation
  - **NEW:** Each API key gets its own storage namespace
  - **NEW:** API key request system with admin approval workflow
  - **NEW:** Users request specific storage quotas instead of default allocation

- 📂 **Advanced Storage Control**
  - All users share the same S3 bucket with intelligent prefix routing
  - **API Key Storage:** Isolated folders using `apikeys/{accessKeyId}/` for complete separation
  - **User Storage:** Traditional `users/{userId}/` prefix for JWT authentication (backward compatible)
  - Real-time quota enforcement before file uploads
  - Tier-based quotas (storage in GB, object count)
  - **NEW:** Quota exceeded events automatically logged for monitoring
  - Real-time usage tracking with database synchronization
  - Secure file operations with presigned URLs
  - **NEW:** Bulk file operations (bulk delete)
  - **NEW:** Detailed file metadata and analytics
  - **NEW:** File categorization and storage analytics
  - **NEW:** Enhanced file listing with size calculations
  - **NEW:** Automatic folder creation when generating API keys

- 💳 **Comprehensive Billing System**
  - **FREE TIER:** All users currently get unlimited storage (stub implementation)
  - Supports Stripe/Razorpay (fiat payments) - stub implementation ready
  - Supports crypto (ETH, USDC, BTC) with manual or credit-based renewals - stub implementation
  - Complete invoice management system
  - Subscription lifecycle management
  - Admin approval for tier upgrades/downgrades

- 💰 **Credit & Payment Management**
  - **FREE TIER:** Unlimited credits for all users
  - Credit balance tracking and transaction history
  - Payment method management (stub implementation)
  - Payment processing with transaction history
  - Refund processing capabilities

- 📊 **Advanced Usage Tracking & Analytics**
  - Real-time usage tracking with quota percentage calculation
  - Historical usage snapshots for analytics
  - **NEW:** Storage analytics with file type breakdown
  - **NEW:** Recent files tracking
  - **NEW:** Comprehensive usage statistics
  - Audit logging for all storage operations
  - Database-S3 synchronization for accurate usage data

- 🛠 **Professional UI-Ready API**
  - **NEW:** Complete user account management endpoints
  - **NEW:** Billing and payment management endpoints
  - **NEW:** Credit management system
  - **NEW:** Enhanced file metadata endpoints
  - **NEW:** Storage analytics endpoints
  - **NEW:** Bulk operations support

- 🚀 **Developer-Friendly**
  - RESTful API design with consistent response format
  - Comprehensive error handling with detailed messages
  - TypeScript support throughout
  - Modular architecture with services, controllers, and repositories
  - **NEW:** Complete API documentation (see API_DOCUMENTATION.md)
  - **NEW:** Professional-grade endpoints ready for UI integration

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

Pockity ensures complete data isolation between users and API keys through several security measures:

### Dual-Mode Storage Isolation

#### API Key-Based Isolation
- Each API key gets its own isolated folder: `apikeys/{accessKeyId}/`
- Automatic folder creation when generating new API key pairs
- Complete separation between different API keys, even from the same user
- Perfect for multi-application or multi-environment usage

#### User-Based Isolation (Legacy Support)
- Traditional user folders: `users/{userId}/`
- Maintains backward compatibility with JWT authentication
- All existing user data remains accessible

### Storage Operation Security
- All storage operations validate ownership before allowing access
- Users/API keys cannot access files belonging to others
- Presigned URLs are generated with appropriate permissions
- Intelligent prefix routing based on authentication method

### API Key Security
- API keys use a two-part system: `accessKeyId` and `secretKey`
- Secret keys are hashed using bcrypt before storage
- Keys can be revoked instantly and have activity tracking
- Each key can optionally be tied to specific tier permissions
- Automatic S3 folder provisioning ensures immediate isolation

### Admin Controls
- Admin-only endpoints for managing API key requests and approvals
- **NEW:** Comprehensive admin dashboard with system health monitoring
- **NEW:** User analytics and API key overview for administrators
- **NEW:** Real-time audit log monitoring with filtering capabilities
- Role-based middleware ensures only admins can access sensitive operations
- Comprehensive audit logging for all administrative actions

### Audit & Compliance
- **NEW:** Strict audit logging for all critical system events
- **NEW:** Automated logging of user registration, login, profile updates, deletions
- **NEW:** Complete API key lifecycle tracking (creation, usage, revocation)
- **NEW:** Email verification events and quota exceeded incidents
- **NEW:** Admin action logging with detailed metadata
- **NEW:** IP address and user agent tracking for security analysis

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

### User Management
- `GET /api/users/profile` → Get user profile with usage and subscription info
- `PUT /api/users/profile` → Update user profile (name, email)
- `POST /api/users/change-password` → Change user password
- `GET /api/users/summary` → Get comprehensive account summary
- `DELETE /api/users/account` → Delete user account

### API Key Management
- `POST /api/apikeys` → Generate new API key pair
- `GET /api/apikeys` → List user's API keys
- `GET /api/apikeys/:id` → Get specific API key details
- `DELETE /api/apikeys/:id` → Revoke API key

### Enhanced Storage Operations
- `POST /api/storage/upload` → Upload file with quota enforcement
- `GET /api/storage/files` → List all user's files with metadata
- `GET /api/storage/files/:fileName` → Get file download URL
- `GET /api/storage/files/:fileName/metadata` → Get detailed file metadata
- `DELETE /api/storage/files/:fileName` → Delete file
- `POST /api/storage/files/bulk-delete` → Bulk delete multiple files
- `GET /api/storage/usage` → Get storage usage statistics with quota info
- `GET /api/storage/analytics` → Get storage analytics with file type breakdown

### Billing Management
- `GET /api/billing/plans` → Get available billing plans
- `GET /api/billing/subscription` → Get user's current subscription
- `POST /api/billing/subscription` → Create new subscription
- `POST /api/billing/subscription/cancel` → Cancel subscription
- `GET /api/billing/invoices` → Get user's invoices
- `POST /api/billing/invoices` → Create invoice
- `GET /api/billing/summary` → Get comprehensive billing summary

### Payment Management
- `POST /api/payments/intents` → Create payment intent
- `POST /api/payments/process` → Process payment
- `GET /api/payments/methods` → Get payment methods
- `POST /api/payments/methods` → Add payment method
- `GET /api/payments/history` → Get payment history
- `POST /api/payments/refund` → Refund payment

### Credit Management
- `GET /api/credits/balance` → Get credit balance
- `POST /api/credits/add` → Add credits to account
- `POST /api/credits/deduct` → Deduct credits from account
- `GET /api/credits/history` → Get credit transaction history
- `GET /api/credits/check` → Check if user has sufficient credits

### Tier Management
- `GET /api/tiers` → List available tiers
- `POST /api/tier-requests` → Request tier upgrade
- `GET /api/tier-requests` → Get user's tier requests

### API Key Request Management
- `POST /api/api-key-requests` → Create API key request with custom storage quota
- `GET /api/api-key-requests` → Get user's API key requests
- `GET /api/api-key-requests/:id` → Get specific API key request details

### Admin Operations
- `GET /api/tier-requests/admin/all` → List all tier requests (admin only)
- `PATCH /api/tier-requests/admin/:id/approve` → Approve/reject tier request (admin only)
- `GET /api/tiers/admin/all` → List all tiers including private ones (admin only)
- `GET /api/api-key-requests/admin/all` → List all API key requests (admin only)
- `PATCH /api/api-key-requests/admin/:id/review` → Approve/reject API key request (admin only)

### Admin Dashboard
- `GET /api/admin/health` → System health and statistics overview
- `GET /api/admin/users` → User analytics and management data
- `GET /api/admin/api-keys` → API key overview and usage statistics
- `GET /api/admin/audit-logs` → System audit logs with filtering

### Public Endpoints
- `GET /api/open/health` → Health check

**📖 For detailed API documentation with request/response schemas, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

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

### Enhanced File Operations
```bash
# Upload with API key authentication (uses apikeys/{accessKeyId}/ folder)
curl -X POST http://localhost:8080/api/storage/upload \
  -H "x-access-key-id: pk_your_access_key" \
  -H "x-secret-key: sk_your_secret_key" \
  -F "file=@/path/to/your/file.txt"

# Upload with JWT authentication (uses users/{userId}/ folder)
curl -X POST http://localhost:8080/api/storage/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/file.txt"

# List files (works with both authentication methods)
curl -X GET http://localhost:8080/api/storage/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List files with API key
curl -X GET http://localhost:8080/api/storage/files \
  -H "x-access-key-id: pk_your_access_key" \
  -H "x-secret-key: sk_your_secret_key"

# Get detailed file metadata
curl -X GET http://localhost:8080/api/storage/files/filename.txt/metadata \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get file download URL
curl -X GET http://localhost:8080/api/storage/files/filename.txt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Delete a file
curl -X DELETE http://localhost:8080/api/storage/files/filename.txt \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Bulk delete files
curl -X POST http://localhost:8080/api/storage/files/bulk-delete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileNames": ["file1.txt", "file2.txt", "file3.txt"]}'

# Get storage usage with quota information
curl -X GET http://localhost:8080/api/storage/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get storage analytics
curl -X GET http://localhost:8080/api/storage/analytics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### User Account Management
```bash
# Get user profile with usage and subscription info
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update user profile
curl -X PUT http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name", "email": "newemail@example.com"}'

# Change password
curl -X POST http://localhost:8080/api/users/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "oldpass", "newPassword": "newpass123"}'

# Get comprehensive account summary
curl -X GET http://localhost:8080/api/users/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Key Request Management
```bash
# Request custom storage quota for API key
curl -X POST http://localhost:8080/api/api-key-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestedStorageGB": 5,
    "requestedObjects": 10000,
    "reason": "Need additional storage for my application data backup"
  }'

# Get your API key requests
curl -X GET http://localhost:8080/api/api-key-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get specific request details
curl -X GET http://localhost:8080/api/api-key-requests/request_id \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Admin Dashboard & Management
```bash
# Get system health overview (admin only)
curl -X GET http://localhost:8080/api/admin/health \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get user analytics (admin only)
curl -X GET http://localhost:8080/api/admin/users?limit=20&offset=0 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get API key overview (admin only)
curl -X GET http://localhost:8080/api/admin/api-keys \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get system audit logs (admin only)
curl -X GET "http://localhost:8080/api/admin/audit-logs?action=USER_LOGIN&limit=100" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Review API key request (admin only)
curl -X PATCH http://localhost:8080/api/api-key-requests/admin/request_id/review \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "reviewerComment": "Approved for legitimate business use"
  }'
```

### Billing & Payment Management
```bash
# Get available billing plans
curl -X GET http://localhost:8080/api/billing/plans \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get current subscription
curl -X GET http://localhost:8080/api/billing/subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create subscription
curl -X POST http://localhost:8080/api/billing/subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "plan_free"}'

# Get billing summary
curl -X GET http://localhost:8080/api/billing/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get credit balance
curl -X GET http://localhost:8080/api/credits/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check credit sufficiency
curl -X GET "http://localhost:8080/api/credits/check?amount=1000" \
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

## 🎯 Current Status

**🟢 FREE TIER ACTIVE:** All users currently have unlimited storage and credits. This is a complete implementation with stub billing services ready for production integration.

**✅ Completed Features:**
- Complete user authentication and profile management
- Real-time quota enforcement and usage tracking  
- Advanced file operations with metadata and analytics
- Comprehensive billing system (free tier active)
- Payment and credit management (stub implementation)
- Professional-grade API endpoints ready for UI integration
- Complete API documentation

**🔄 Production Ready:**
- All services include stub implementations for easy payment provider integration
- Database schema supports full billing and subscription features
- Audit logging and usage tracking ensure data accuracy
- Modular architecture allows easy feature extension

---

## 📜 License

MIT License.  
Built with ❤️ to make infinite storage more accessible.
