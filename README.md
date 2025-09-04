# 📦 Pockity

Pockity is a **secure, multi-tenant cloud storage service** that provides each user with isolated, quota-controlled storage inside a shared S3 bucket.  
Inspired by Doraemon's infinite pocket, Pockity aims to give developers a **scalable, API-first cloud storage solution** with flexible quota management and robust API key authentication.

---

## ✨ Features

- 🔐 **Authentication & User Management**
  - Email/password authentication with JWT tokens
  - Complete user profile management (update profile, change password, account deletion)
  - Email verification via OTP system
  - Role-based access control (USER/ADMIN)
  - Comprehensive account summary with usage data
  - Complete audit logging for all critical user events

- 🔑 **API Key Management with Admin Approval**
  - Request-based API key generation with custom quotas
  - Admin approval workflow for all API key requests
  - Multiple API key pairs per user with individual quotas
  - Secure key storage with bcrypt hashing
  - Revocation & activity tracking
  - Automatic S3 folder creation for complete isolation
  - Each API key gets its own storage namespace

- 📂 **Advanced Storage Control**
  - All users share the same S3 bucket with intelligent prefix routing
  - **API Key Storage:** Isolated folders using `apikeys/{accessKeyId}/` for complete separation
  - Real-time quota enforcement before file uploads
  - Configurable quotas per API key (storage in GB, object count)
  - Quota exceeded events automatically logged for monitoring
  - Real-time usage tracking with database synchronization
  - Secure file operations with presigned URLs
  - Bulk file operations (bulk delete)
  - Detailed file metadata and analytics
  - File categorization and storage analytics
  - Enhanced file listing with size calculations

- 📊 **Advanced Usage Tracking & Analytics**
  - Real-time usage tracking with quota percentage calculation
  - Storage analytics with file type breakdown
  - Recent files tracking
  - Comprehensive usage statistics
  - Audit logging for all storage operations
  - Database-S3 synchronization for accurate usage data

- 🛠 **Professional API-First Design**
  - Complete user account management endpoints
  - Enhanced file metadata endpoints
  - Storage analytics endpoints
  - Bulk operations support
  - Admin dashboard with system health monitoring

- 🚀 **Developer-Friendly**
  - RESTful API design with consistent response format
  - Comprehensive error handling with detailed messages
  - TypeScript support throughout
  - Modular architecture with services, controllers, and repositories
  - Complete API documentation (see API_DOCUMENTATION.md)
  - Professional-grade endpoints ready for UI integration

---

## 🏗 Tech Stack

- **Backend:** Node.js + TypeScript + Express
- **Database:** PostgreSQL(AWS RDS) + Prisma ORM
- **Storage:** AWS S3 (single bucket, per-API-key prefixes)
- **Auth:** JWT-based user authentication + API key authentication
- **File Upload:** Multer middleware for multipart/form-data
- **AWS SDK:** @aws-sdk/client-s3 for S3 operations
- **Security:** bcrypt for password/key hashing, CORS protection
- **Validation:** Zod for request validation
- **Email:** Nodemailer for OTP verification
- **Deployment and CI/CD:** AWS EC2, AWS RDS, Route53, Github, Github Actions

---

## 🔒 Security & Data Isolation

Pockity ensures complete data isolation between users and API keys through several security measures:

### API Key-Based Isolation

- Each API key gets its own isolated folder: `apikeys/{accessKeyId}/`
- Automatic folder creation when API keys are approved
- Complete separation between different API keys, even from the same user
- Perfect for multi-application or multi-environment usage

### Storage Operation Security

- All storage operations validate ownership before allowing access
- Users/API keys cannot access files belonging to others
- Presigned URLs are generated with appropriate permissions
- Intelligent prefix routing based on authentication method

### API Key Security

- API keys use a two-part system: `accessKeyId` and `secretKey`
- Secret keys are hashed using bcrypt before storage
- Keys can be revoked instantly and have activity tracking
- Each key has configurable quota permissions
- Automatic S3 folder provisioning ensures immediate isolation

### Admin Controls

- Admin-only endpoints for managing API key requests and approvals
- Comprehensive admin dashboard with system health monitoring
- User analytics and API key overview for administrators
- Real-time audit log monitoring with filtering capabilities
- Role-based middleware ensures only admins can access sensitive operations
- Comprehensive audit logging for all administrative actions

### Audit & Compliance

- Strict audit logging for all critical system events
- Automated logging of user registration, login, profile updates, deletions
- Complete API key lifecycle tracking (creation, usage, revocation)
- Email verification events and quota exceeded incidents
- Admin action logging with detailed metadata
- IP address and user agent tracking for security analysis

### Environment Security

- All AWS credentials and sensitive data stored in environment variables
- JWT tokens for secure authentication
- CORS protection with configurable origins

---

## 🚀 Quick Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- AWS S3 bucket
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone https://github.com/bharatbhusal/pockity.git
cd pockity

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run prisma:generate
npm run prisma:migrate:deploy

# Build and start
npm run build
npm start

# Or run in development mode
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pockity"
JWT_SECRET="your-jwt-secret"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="your-s3-bucket"
ENCRYPTION_KEY="your-encryption-key"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-email-password"
```

---

## 📡 API Overview

### Authentication

- `POST /api/auth/register` → User registration
- `POST /api/auth/login` → User login with JWT token

### Email Verification

- `POST /api/otp/send` → Send OTP to user's email
- `POST /api/otp/verify/:otp` → Verify OTP and mark email as verified

### User Management

- `GET /api/users/profile` → Get user profile with API keys info
- `PUT /api/users/profile` → Update user profile (name, email)
- `POST /api/users/change-password` → Change user password
- `GET /api/users/summary` → Get comprehensive account summary with usage data
- `DELETE /api/users/account` → Delete user account

### API Key Management

- `GET /api/apiKeys` → List user's API keys
- `GET /api/apiKeys/:id` → Get specific API key details
- `DELETE /api/apiKeys/:id` → Revoke API key

### API Key Request Management

- `GET /api/apiKeys/request` → Get user's API key requests
- `POST /api/apiKeys/request/create` → Create API key request with custom storage quota
- `POST /api/apiKeys/request/upgrade` → Create API key upgrade request
- `GET /api/apiKeys/request/:id` → Get specific API key request details

### File Storage (API Key Authentication Required)

- `POST /api/storage/upload` → Upload file with quota enforcement
- `GET /api/storage/files` → List all files with metadata
- `GET /api/storage/files/:fileName` → Get file download URL
- `GET /api/storage/files/:fileName/metadata` → Get detailed file metadata
- `DELETE /api/storage/files/:fileName` → Delete file
- `POST /api/storage/files/bulk-delete` → Bulk delete multiple files
- `GET /api/storage/usage` → Get storage usage statistics with quota info
- `GET /api/storage/analytics` → Get storage analytics with file type breakdown

### Admin Operations

- `GET /api/apiKeys/request/admin/all` → List all API key requests (admin only)
- `PATCH /api/apiKeys/request/admin/review/:id` → Approve/reject API key request (admin only)

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

# Send email verification OTP
curl -X POST http://localhost:8080/api/otp/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify email with OTP
curl -X POST http://localhost:8080/api/otp/verify/123456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Key Request Flow

```bash
# Request a new API key with custom quotas
curl -X POST http://localhost:8080/api/apiKeys/request/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyName": "My Production API Key",
    "requestedStorageGB": 5,
    "requestedObjects": 10000,
    "reason": "Need storage for my application data backup and file sharing features"
  }'

# Check API key request status
curl -X GET http://localhost:8080/api/apiKeys/request \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Admin: Review API key request (approve/reject)
curl -X PATCH http://localhost:8080/api/apiKeys/request/admin/review/REQUEST_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "reviewerComment": "Approved for legitimate business use"
  }'
```

### File Storage Operations

```bash
# Upload file using API key authentication
curl -X POST http://localhost:8080/api/storage/upload \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key" \
  -F "file=@/path/to/your/file.txt"

# List all files
curl -X GET http://localhost:8080/api/storage/files \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key"

# Get file download URL
curl -X GET http://localhost:8080/api/storage/files/filename.txt \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key"

# Get detailed file metadata
curl -X GET http://localhost:8080/api/storage/files/filename.txt/metadata \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key"

# Delete a file
curl -X DELETE http://localhost:8080/api/storage/files/filename.txt \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key"

# Bulk delete multiple files
curl -X POST http://localhost:8080/api/storage/files/bulk-delete \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{"fileNames": ["file1.txt", "file2.txt", "file3.txt"]}'

# Get storage usage and quota information
curl -X GET http://localhost:8080/api/storage/usage \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key"

# Get storage analytics
curl -X GET http://localhost:8080/api/storage/analytics \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key"
```

### User Account Management

```bash
# Get user profile
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update user profile
curl -X PUT http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "email": "newemail@example.com"}'

# Change password
curl -X POST http://localhost:8080/api/users/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "oldpass", "newPassword": "newpass123"}'

# Get comprehensive account summary
curl -X GET http://localhost:8080/api/users/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Admin Dashboard

```bash
# Get system health and statistics
curl -X GET http://localhost:8080/api/admin/health \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get user analytics
curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get API key overview
curl -X GET http://localhost:8080/api/admin/api-keys \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Get audit logs
curl -X GET http://localhost:8080/api/admin/audit-logs \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## 🔧 Core Concepts

### Quota Management

- Each API key has individual storage quotas (GB) and object count limits
- Quotas are requested by users and approved by admins
- Real-time quota checking before file uploads
- Usage tracking with percentage calculations
- Quota exceeded events are logged for monitoring

### Storage Isolation

- **API Key Storage:** `apikeys/{accessKeyId}/` - Complete isolation per API key
- Files uploaded with different authentication methods are completely isolated
- Automatic folder creation when API keys are approved

### Admin Approval Workflow

1. User requests API key with desired quotas and provides justification
2. Admin reviews the request and can approve/reject with comments
3. Upon approval, API key is generated and S3 folder is created
4. User receives access key ID and secret key for programmatic access
5. All actions are logged in audit trail

### Authentication Methods

- **JWT Authentication:** For user management, profile operations, API key requests
- **API Key Authentication:** For file storage operations only
- Each method provides access to different endpoints and isolated storage

---

## 📊 Monitoring & Analytics

### Usage Tracking

- Real-time storage usage monitoring per API key
- File type categorization and analytics
- Upload/download activity tracking
- Quota utilization percentages

### Audit Logging

- Complete audit trail for all critical operations
- User registration, login, profile changes, account deletion
- API key lifecycle (creation, usage, revocation)
- File operations (upload, download, delete)
- Admin actions and approvals

### Admin Dashboard

- System health monitoring
- User analytics and activity overview
- API key usage statistics
- Audit log analysis with filtering

---

## 🔮 Future Enhancements

- **Web Dashboard:** React/Next.js admin panel and user portal
- **Advanced Analytics:** Usage trends, growth metrics, cost analysis
- **Webhook System:** Real-time notifications for quota events and admin actions
- **CDN Integration:** CloudFront for faster file delivery
- **Backup & Recovery:** Automated backup strategies and disaster recovery
- **Multi-Region Support:** Global S3 bucket distribution

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions, issues, or contributions:

- **GitHub Issues:** [Create an issue](https://github.com/bharatbhusal/pockity/issues)
- **Email:** bharatbhusal78@gmail.com
- **Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API reference
