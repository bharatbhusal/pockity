# Pockity API Documentation

## Overview

Pockity is a comprehensive cloud storage service similar to Cloudinary, providing file storage, user management, billing, and analytics. This documentation covers all available API endpoints.

**Base URL:** `http://localhost:8080/api`

## Authentication

Pockity supports two authentication methods:

### 1. JWT Authentication
Most endpoints support JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### 2. API Key Authentication
For programmatic access, you can use API key authentication with these headers:

```
x-access-key-id: <your_access_key_id>
x-secret-key: <your_secret_key>
```

**Storage Isolation:**
- **JWT Authentication:** Files are stored in `users/{userId}/` folders
- **API Key Authentication:** Files are stored in `apikeys/{accessKeyId}/` folders for complete isolation

**Important:** Each API key gets its own isolated storage space, separate from other API keys and user storage.

## Storage Isolation

Pockity implements automatic storage isolation based on your authentication method:

### API Key Storage
- **Folder Structure:** `apikeys/{accessKeyId}/`
- **Isolation:** Complete separation between different API keys
- **Creation:** Automatic folder provisioning when generating API keys
- **Use Case:** Perfect for multi-application or multi-environment usage

### User Storage (JWT)
- **Folder Structure:** `users/{userId}/`
- **Isolation:** Traditional user-based separation
- **Backward Compatibility:** All existing user data remains accessible
- **Use Case:** Direct user authentication and existing integrations

### Cross-Authentication Access
- Files uploaded with API key authentication are **not** accessible via JWT authentication
- Files uploaded with JWT authentication are **not** accessible via API key authentication
- This ensures complete isolation and security between different access methods

## Response Format

All API responses follow a consistent structure:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null,
  "meta": object | null
}
```

## Error Handling

Error responses include:
- `success`: false
- `message`: Error description
- `details`: Additional error information (for validation errors)

HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `413`: Payload Too Large
- `500`: Internal Server Error

## Endpoints

### Authentication

#### Register User
- **POST** `/auth/register`
- **Description:** Register a new user account
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "token": "jwt_token"
  }
}
```

#### Login User
- **POST** `/auth/login`
- **Description:** Authenticate user and get JWT token
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "token": "jwt_token"
  }
}
```

### User Management

#### Get User Profile
- **GET** `/users/profile`
- **Auth:** Required
- **Description:** Get current user's profile with usage and subscription info
- **Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "emailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "usage": {
      "bytesUsed": "1048576",
      "objectsUsed": 5,
      "quotaBytes": "1073741824",
      "quotaObjects": 1000,
      "usagePercentage": {
        "bytes": 0.1,
        "objects": 0.5
      }
    },
    "subscription": {
      "id": "sub_id",
      "planId": "plan_id",
      "status": "ACTIVE",
      "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
    }
  }
}
```

#### Update User Profile
- **PUT** `/users/profile`
- **Auth:** Required
- **Description:** Update user profile information
- **Body:**
```json
{
  "name": "John Smith",
  "email": "newmail@example.com"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "newmail@example.com",
      "name": "John Smith",
      "role": "USER",
      "emailVerified": false,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Change Password
- **POST** `/users/change-password`
- **Auth:** Required
- **Description:** Change user password
- **Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {}
}
```

#### Get Account Summary
- **GET** `/users/summary`
- **Auth:** Required
- **Description:** Get comprehensive account information
- **Response:**
```json
{
  "success": true,
  "message": "Account summary retrieved successfully",
  "data": {
    "profile": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "emailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "usage": {
      "current": {
        "bytesUsed": "1048576",
        "objectsUsed": 5,
        "lastUpdated": "2024-01-01T00:00:00.000Z"
      },
      "quota": {
        "maxBytes": "1073741824",
        "maxObjects": 1000
      },
      "percentage": {
        "bytes": 0.1,
        "objects": 0.5
      }
    },
    "billing": {
      "subscription": {},
      "nextInvoiceAmount": 0,
      "nextInvoiceDate": "2024-02-01T00:00:00.000Z",
      "paymentMethodsCount": 2,
      "creditsBalance": 999999
    }
  }
}
```

#### Delete Account
- **DELETE** `/users/account`
- **Auth:** Required
- **Description:** Delete user account (marks for deletion)
- **Response:**
```json
{
  "success": true,
  "message": "Account deletion initiated. All data will be removed within 30 days.",
  "data": {}
}
```

### File Storage

#### Upload File
- **POST** `/storage/upload`
- **Auth:** Required (JWT or API Key)
- **Content-Type:** `multipart/form-data`
- **Description:** Upload a file with quota enforcement. Files are stored in different folders based on authentication method:
  - JWT: `users/{userId}/filename`
  - API Key: `apikeys/{accessKeyId}/filename`
- **Body:** Form data with `file` field

**Example with JWT:**
```bash
curl -X POST /storage/upload \
  -H "Authorization: Bearer jwt_token" \
  -F "file=@document.pdf"
```

**Example with API Key:**
```bash
curl -X POST /storage/upload \
  -H "x-access-key-id: pk_your_access_key" \
  -H "x-secret-key: sk_your_secret_key" \
  -F "file=@document.pdf"
```

- **Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileName": "example.jpg",
    "key": "apikeys/pk_abc123/example.jpg",  // or "users/user_id/example.jpg"
    "url": "https://presigned-url.com",
    "size": 1048576,
    "contentType": "image/jpeg"
  }
}
```

#### List Files
- **GET** `/storage/files`
- **Auth:** Required (JWT or API Key)
- **Description:** List all files accessible to the authenticated user/API key. Returns files from:
  - JWT: `users/{userId}/` folder
  - API Key: `apikeys/{accessKeyId}/` folder

**Example with JWT:**
```bash
curl -X GET /storage/files \
  -H "Authorization: Bearer jwt_token"
```

**Example with API Key:**
```bash
curl -X GET /storage/files \
  -H "x-access-key-id: pk_your_access_key" \
  -H "x-secret-key: sk_your_secret_key"
```
- **Response:**
```json
{
  "success": true,
  "message": "Files retrieved successfully",
  "data": {
    "files": [
      {
        "key": "example.jpg",
        "size": 1048576,
        "lastModified": "2024-01-01T00:00:00.000Z",
        "url": "https://presigned-url.com"
      }
    ],
    "totalFiles": 1,
    "totalSize": 1048576
  }
}
```

#### Get File Download URL
- **GET** `/storage/files/:fileName`
- **Auth:** Required (JWT or API Key)
- **Description:** Get presigned download URL for a file. Looks for files in the appropriate folder based on authentication method.
- **Response:**
```json
{
  "success": true,
  "message": "File URL generated successfully",
  "data": {
    "fileName": "example.jpg",
    "url": "https://presigned-url.com",
    "size": 1048576,
    "lastModified": "2024-01-01T00:00:00.000Z",
    "contentType": "image/jpeg"
  }
}
```

#### Get File Metadata
- **GET** `/storage/files/:fileName/metadata`
- **Auth:** Required (JWT or API Key)
- **Description:** Get detailed file metadata. Accesses files from the appropriate folder based on authentication method.
- **Response:**
```json
{
  "success": true,
  "message": "File metadata retrieved successfully",
  "data": {
    "fileName": "example.jpg",
    "key": "users/user_id/example.jpg",
    "size": 1048576,
    "sizeFormatted": "1.00 MB",
    "lastModified": "2024-01-01T00:00:00.000Z",
    "contentType": "image/jpeg",
    "downloadUrl": "https://presigned-url.com",
    "sharingEnabled": true
  }
}
```

#### Delete File
- **DELETE** `/storage/files/:fileName`
- **Auth:** Required (JWT or API Key)
- **Description:** Delete a file from the appropriate storage folder based on authentication method.
- **Response:**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "fileName": "example.jpg"
  }
}
```

#### Bulk Delete Files
- **POST** `/storage/files/bulk-delete`
- **Auth:** Required (JWT or API Key)
- **Description:** Delete multiple files at once from the appropriate storage folder based on authentication method.
- **Body:**
```json
{
  "fileNames": ["file1.jpg", "file2.jpg", "file3.jpg"]
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Bulk delete completed: 2 succeeded, 1 failed",
  "data": {
    "results": [
      {
        "fileName": "file1.jpg",
        "success": true,
        "size": 1048576
      },
      {
        "fileName": "file2.jpg",
        "success": true,
        "size": 2097152
      },
      {
        "fileName": "file3.jpg",
        "success": false,
        "error": "File not found"
      }
    ],
    "summary": {
      "totalFiles": 3,
      "successCount": 2,
      "failCount": 1,
      "totalSizeDeleted": 3145728,
      "totalSizeDeletedFormatted": "3.00 MB"
    }
  }
}
```

#### Get Storage Usage
- **GET** `/storage/usage`
- **Auth:** Required (JWT or API Key)
- **Description:** Get storage usage statistics with quota info for the authenticated user/API key's storage space.
- **Response:**
```json
{
  "success": true,
  "message": "Storage usage retrieved successfully",
  "data": {
    "totalBytes": "1048576",
    "totalSizeGB": 0.00,
    "objectCount": 5,
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "quota": {
      "maxBytes": "1073741824",
      "maxSizeGB": 1.00,
      "maxObjects": 1000
    },
    "usagePercentage": {
      "bytes": 0.1,
      "objects": 0.5
    }
  }
}
```

#### Get Storage Analytics
- **GET** `/storage/analytics`
- **Auth:** Required (JWT or API Key)
- **Description:** Get detailed storage analytics for the authenticated user/API key's storage space.
- **Response:**
```json
{
  "success": true,
  "message": "Storage analytics retrieved successfully",
  "data": {
    "summary": {
      "totalFiles": 10,
      "totalSize": 10485760,
      "totalSizeFormatted": "10.00 MB",
      "quotaUsagePercentage": {
        "bytes": 1.0,
        "objects": 1.0
      }
    },
    "fileTypeBreakdown": [
      {
        "category": "Images",
        "count": 5,
        "totalSize": 5242880,
        "totalSizeFormatted": "5.00 MB",
        "percentage": 50
      },
      {
        "category": "Documents",
        "count": 3,
        "totalSize": 3145728,
        "totalSizeFormatted": "3.00 MB",
        "percentage": 30
      }
    ],
    "recentFiles": [
      {
        "fileName": "recent.jpg",
        "size": 1048576,
        "sizeFormatted": "1.00 MB",
        "lastModified": "2024-01-01T00:00:00.000Z",
        "category": "Images"
      }
    ]
  }
}
```

### API Key Management

#### Generate API Key
- **POST** `/apikeys`
- **Auth:** Required
- **Description:** Generate a new API key pair. Automatically creates an isolated S3 storage folder at `apikeys/{accessKeyId}/` for complete storage separation.
- **Body:**
```json
{
  "name": "My API Key",
  "tierId": "tier_id_optional"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "id": "key_id",
    "accessKeyId": "pk_abc123def456",
    "secretKey": "sk_xyz789uvw012",
    "name": "My API Key",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Note:** The response includes both `accessKeyId` and `secretKey`. Store these securely as the secret key cannot be retrieved again. The system automatically provisions an isolated S3 folder for this API key.

#### List API Keys
- **GET** `/apikeys`
- **Auth:** Required
- **Description:** List user's API keys (secrets hidden)
- **Response:**
```json
{
  "success": true,
  "message": "API keys retrieved successfully",
  "data": {
    "apiKeys": [
      {
        "id": "key_id",
        "accessKeyId": "access_key",
        "name": "My API Key",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastUsedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

#### Get API Key Details
- **GET** `/apikeys/:id`
- **Auth:** Required
- **Description:** Get specific API key details
- **Response:**
```json
{
  "success": true,
  "message": "API key retrieved successfully",
  "data": {
    "apiKey": {
      "id": "key_id",
      "accessKeyId": "access_key",
      "name": "My API Key",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastUsedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

#### Revoke API Key
- **DELETE** `/apikeys/:id`
- **Auth:** Required
- **Description:** Revoke an API key
- **Response:**
```json
{
  "success": true,
  "message": "API key revoked successfully",
  "data": {}
}
```

### Billing Management

#### Get Billing Plans
- **GET** `/billing/plans`
- **Auth:** Required
- **Description:** Get available billing plans
- **Response:**
```json
{
  "success": true,
  "message": "Billing plans retrieved successfully",
  "data": {
    "plans": [
      {
        "id": "plan_free",
        "name": "Free",
        "monthlyQuotaGB": 1,
        "maxObjects": 1000,
        "priceCents": 0,
        "currency": "usd",
        "trialDays": 30,
        "features": [
          "1GB storage",
          "1000 objects",
          "API access",
          "File sharing",
          "Basic features"
        ]
      }
    ]
  }
}
```

#### Get User Subscription
- **GET** `/billing/subscription`
- **Auth:** Required
- **Description:** Get user's current subscription
- **Response:**
```json
{
  "success": true,
  "message": "Subscription retrieved successfully",
  "data": {
    "subscription": {
      "id": "sub_id",
      "userId": "user_id",
      "planId": "plan_free",
      "status": "ACTIVE",
      "currentPeriodStart": "2024-01-01T00:00:00.000Z",
      "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
    }
  }
}
```

#### Create Subscription
- **POST** `/billing/subscription`
- **Auth:** Required
- **Description:** Create a new subscription
- **Body:**
```json
{
  "planId": "plan_id"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "id": "sub_id",
      "userId": "user_id",
      "planId": "plan_id",
      "status": "ACTIVE",
      "currentPeriodStart": "2024-01-01T00:00:00.000Z",
      "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
    }
  }
}
```

#### Cancel Subscription
- **POST** `/billing/subscription/cancel`
- **Auth:** Required
- **Description:** Cancel current subscription
- **Body:**
```json
{
  "subscriptionId": "sub_id"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscription": {
      "id": "sub_id",
      "status": "CANCELLED",
      "canceledAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Get User Invoices
- **GET** `/billing/invoices?limit=50`
- **Auth:** Required
- **Description:** Get user's invoices
- **Query Parameters:**
  - `limit`: Number of invoices to return (default: 50)
- **Response:**
```json
{
  "success": true,
  "message": "Invoices retrieved successfully",
  "data": {
    "invoices": [
      {
        "id": "inv_id",
        "userId": "user_id",
        "amountCents": 0,
        "currency": "usd",
        "status": "PAID",
        "description": "Free tier: Monthly subscription",
        "paidAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalInvoices": 1
  }
}
```

#### Get Billing Summary
- **GET** `/billing/summary`
- **Auth:** Required
- **Description:** Get comprehensive billing summary
- **Response:**
```json
{
  "success": true,
  "message": "Billing summary retrieved successfully",
  "data": {
    "subscription": {
      "id": "sub_id",
      "planId": "plan_free",
      "status": "ACTIVE"
    },
    "nextInvoiceAmount": 0,
    "nextInvoiceDate": "2024-02-01T00:00:00.000Z",
    "paymentMethodsCount": 2,
    "creditsBalance": 999999
  }
}
```

### Payment Management

#### Create Payment Intent
- **POST** `/payments/intents`
- **Auth:** Required
- **Description:** Create a payment intent (stub implementation)
- **Body:**
```json
{
  "amountCents": 1000,
  "currency": "usd",
  "provider": "STRIPE",
  "metadata": {}
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "paymentIntent": {
      "id": "pi_stub_123456789",
      "amountCents": 1000,
      "currency": "usd",
      "status": "PENDING",
      "paymentUrl": "https://stub-payment-gateway.com/pay/123456789"
    }
  }
}
```

#### Process Payment
- **POST** `/payments/process`
- **Auth:** Required
- **Description:** Process a payment (stub implementation)
- **Body:**
```json
{
  "paymentIntentId": "pi_stub_123456789",
  "paymentMethodId": "pm_stub_card"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "result": {
      "success": true,
      "transactionId": "txn_stub_123456789",
      "status": "PAID",
      "amountCents": 0,
      "currency": "usd"
    }
  }
}
```

#### Get Payment Methods
- **GET** `/payments/methods`
- **Auth:** Required
- **Description:** Get user's payment methods (stub implementation)
- **Response:**
```json
{
  "success": true,
  "message": "Payment methods retrieved successfully",
  "data": {
    "paymentMethods": [
      {
        "id": "pm_stub_card",
        "type": "CARD",
        "provider": "STRIPE",
        "isDefault": true,
        "metadata": {
          "last4": "4242",
          "brand": "visa",
          "expiryMonth": 12,
          "expiryYear": 2030
        }
      }
    ]
  }
}
```

#### Add Payment Method
- **POST** `/payments/methods`
- **Auth:** Required
- **Description:** Add a payment method (stub implementation)
- **Body:**
```json
{
  "type": "CARD",
  "provider": "STRIPE",
  "metadata": {
    "cardToken": "tok_123456789"
  }
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Payment method added successfully",
  "data": {
    "paymentMethod": {
      "id": "pm_stub_123456789",
      "type": "CARD",
      "provider": "STRIPE",
      "isDefault": false
    }
  }
}
```

#### Get Payment History
- **GET** `/payments/history?limit=50`
- **Auth:** Required
- **Description:** Get payment transaction history
- **Query Parameters:**
  - `limit`: Number of transactions to return (default: 50)
- **Response:**
```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "data": {
    "payments": [
      {
        "success": true,
        "transactionId": "txn_id",
        "status": "PAID",
        "amountCents": 0,
        "currency": "usd"
      }
    ],
    "totalPayments": 1
  }
}
```

### Credit Management

#### Get Credit Balance
- **GET** `/credits/balance`
- **Auth:** Required
- **Description:** Get user's credit balance
- **Response:**
```json
{
  "success": true,
  "message": "Credit balance retrieved successfully",
  "data": {
    "balance": {
      "totalCreditsUSD": 999999,
      "currency": "usd"
    }
  }
}
```

#### Add Credits
- **POST** `/credits/add`
- **Auth:** Required
- **Description:** Add credits to user account
- **Body:**
```json
{
  "amountCents": 1000,
  "source": "payment",
  "metadata": {}
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Credits added successfully",
  "data": {
    "transaction": {
      "id": "credit_id",
      "amountCents": 1000,
      "currency": "usd",
      "source": "payment",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Check Sufficient Credits
- **GET** `/credits/check?amount=1000`
- **Auth:** Required
- **Description:** Check if user has sufficient credits
- **Query Parameters:**
  - `amount`: Amount in cents to check
- **Response:**
```json
{
  "success": true,
  "message": "Credit check completed",
  "data": {
    "hasSufficientCredits": true,
    "requiredAmountCents": 1000
  }
}
```

#### Get Credit History
- **GET** `/credits/history?limit=50`
- **Auth:** Required
- **Description:** Get credit transaction history
- **Query Parameters:**
  - `limit`: Number of transactions to return (default: 50)
- **Response:**
```json
{
  "success": true,
  "message": "Credit history retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "credit_id",
        "amountCents": 1000,
        "currency": "usd",
        "source": "payment",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalTransactions": 1
  }
}
```

### Tier Management

#### Get Available Tiers
- **GET** `/tiers`
- **Auth:** Required
- **Description:** Get publicly available tiers
- **Response:**
```json
{
  "success": true,
  "message": "Tiers retrieved successfully",
  "data": {
    "tiers": [
      {
        "id": "tier_free",
        "name": "Free",
        "monthlyQuotaGB": 1,
        "maxObjects": 1000,
        "priceCents": 0,
        "description": "Free tier for everyone",
        "isPublic": true
      }
    ]
  }
}
```

#### Request Tier Upgrade
- **POST** `/tier-requests`
- **Auth:** Required
- **Description:** Request a tier upgrade
- **Body:**
```json
{
  "tierId": "tier_pro",
  "reason": "Need more storage for my project"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Tier request created successfully",
  "data": {
    "tierRequest": {
      "id": "request_id",
      "userId": "user_id",
      "tierId": "tier_pro",
      "reason": "Need more storage for my project",
      "status": "PENDING",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Get User's Tier Requests
- **GET** `/tier-requests`
- **Auth:** Required
- **Description:** Get user's tier requests
- **Response:**
```json
{
  "success": true,
  "message": "Tier requests retrieved successfully",
  "data": {
    "tierRequests": [
      {
        "id": "request_id",
        "tierId": "tier_pro",
        "reason": "Need more storage",
        "status": "PENDING",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Public Endpoints

#### Health Check
- **GET** `/open/health`
- **Auth:** Not required
- **Description:** Check API health status
- **Response:**
```json
{
  "success": true,
  "message": "Pockity API is running",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0"
  }
}
```

## Rate Limiting

Currently, there are no rate limits implemented, but in a production environment, you should implement rate limiting to prevent abuse.

## File Size Limits

- Maximum file size: 100MB per upload
- Supported file types: All file types are supported

## Error Codes

- `INVALID_INPUT`: Validation error
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `QUOTA_EXCEEDED`: Storage quota exceeded
- `PAYMENT_REQUIRED`: Payment required for premium features

## SDKs and Libraries

Currently, there are no official SDKs, but the API is RESTful and can be used with any HTTP client.

## Support

For support and questions, please contact the development team.