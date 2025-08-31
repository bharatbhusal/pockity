# API Key Authentication for S3 Storage Operations

This implementation adds API key-based authentication for S3 storage operations, allowing developers to use storage as a service without managing user sessions.

## Overview

Users can now perform S3 CRUD operations using API keys instead of JWT tokens. The implementation provides:

1. **API Key Authentication**: Uses `x-access-key-id` and `x-secret-key` headers
2. **Separate Endpoints**: New API endpoints at `/api/v1/storage/*`
3. **Usage Tracking**: Updates user's `lastUsedAt` field on each API key usage
4. **Backward Compatibility**: Existing JWT-based routes remain unchanged

## API Endpoints

### API Key Management (JWT Required)
- `POST /api/apikeys` - Create new API key
- `GET /api/apikeys` - List user's API keys
- `GET /api/apikeys/:id` - Get specific API key
- `DELETE /api/apikeys/:id` - Revoke API key

### Storage Operations (API Key Required)
- `POST /api/v1/storage/upload` - Upload file
- `GET /api/v1/storage/files` - List user's files
- `GET /api/v1/storage/files/:fileName` - Get file (presigned URL)
- `DELETE /api/v1/storage/files/:fileName` - Delete file
- `GET /api/v1/storage/usage` - Get storage usage stats

## Authentication Flow

### 1. Create API Key (One-time setup)
```bash
# Login and get JWT token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Create API key using JWT
curl -X POST http://localhost:3000/api/apikeys \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Storage API Key"}'
```

### 2. Use API Key for Storage Operations
```bash
# Upload file
curl -X POST http://localhost:3000/api/v1/storage/upload \
  -H "x-access-key-id: pk_your_access_key_id" \
  -H "x-secret-key: sk_your_secret_key" \
  -F "file=@example.txt"

# List files
curl -X GET http://localhost:3000/api/v1/storage/files \
  -H "x-access-key-id: pk_your_access_key_id" \
  -H "x-secret-key: sk_your_secret_key"

# Get file URL
curl -X GET http://localhost:3000/api/v1/storage/files/example.txt \
  -H "x-access-key-id: pk_your_access_key_id" \
  -H "x-secret-key: sk_your_secret_key"

# Delete file
curl -X DELETE http://localhost:3000/api/v1/storage/files/example.txt \
  -H "x-access-key-id: pk_your_access_key_id" \
  -H "x-secret-key: sk_your_secret_key"

# Get storage usage
curl -X GET http://localhost:3000/api/v1/storage/usage \
  -H "x-access-key-id: pk_your_access_key_id" \
  -H "x-secret-key: sk_your_secret_key"
```

## Implementation Details

### New Files Added:
- `src/middleware/apiKeyAuth.ts` - API key authentication middleware
- `src/controllers/apiKeyStorageControllers.ts` - Storage controllers for API key auth
- `src/routes/apiKeyStorageRoutes.ts` - API key storage routes

### Database Changes:
- Added `lastUsedAt` field to User model in Prisma schema

### Security Features:
- API keys use bcrypt hashing for secret storage
- Validates API key existence and active status
- Updates usage timestamps for tracking
- Isolated user storage with S3 prefixes

### Error Handling:
- Proper authentication error responses
- File not found handling
- Invalid input validation
- API key revocation/inactive state handling

## Usage Tracking

Every successful API key usage updates:
1. `ApiKey.lastUsedAt` - When the API key was last used
2. `User.lastUsedAt` - When the user account was last active

This enables usage analytics and helps identify inactive accounts/keys.

## Multiple API Keys

Users can create multiple API keys for different projects:
- Each key is independent and can be revoked separately
- Keys can be assigned to different tiers (if implemented)
- Usage is tracked per key but aggregated per user