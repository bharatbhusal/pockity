# Pockity API Documentation

## Overview

Pockity is a secure, multi-tenant cloud storage service that provides file storage with API key management, user authentication, and quota control. Each user gets isolated storage namespaces with granular access control.

**Base URL:** `http://localhost:8080/api`

## Authentication

Pockity supports two authentication methods:

### 1. JWT Authentication (User Access)

For user management and account operations. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### 2. API Key Authentication (Storage Access)

For programmatic file storage operations. Include these headers:

```
x-access-key-id: <your_access_key_id>
x-secret-key: <your_secret_key>
```

## Storage Isolation

Pockity implements automatic storage isolation based on authentication method:

### API Key Storage

- **Folder Structure:** `apikeys/{accessKeyId}/`
- **Isolation:** Complete separation between different API keys
- **Creation:** Automatic folder provisioning when API keys are approved
- **Use Case:** Multi-application or multi-environment usage

### User Storage (JWT) - Legacy Support

- **Folder Structure:** `users/{userId}/`
- **Isolation:** Traditional user-based separation
- **Use Case:** Direct user authentication and existing integrations

**Important:** Files uploaded with API key authentication are NOT accessible via JWT authentication and vice versa.

## Response Format

All API responses follow this consistent structure:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null,
  "meta": object | null
}
```

## Endpoints

### Authentication

#### Register User

- **POST** `/auth/register`
- **Description:** Create a new user account
- **Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
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
      "role": "USER",
      "emailVerified": false
    },
    "token": "jwt_token_here"
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
  "password": "securepassword123"
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
      "role": "USER",
      "emailVerified": false
    },
    "token": "jwt_token_here"
  }
}
```

### Email Verification (OTP)

#### Send OTP

- **POST** `/otp/send`
- **Auth:** Required (JWT)
- **Description:** Send verification OTP to user's email
- **Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "data": {
    "email": "user@example.com"
  }
}
```

#### Verify OTP

- **POST** `/otp/verify/:otp`
- **Auth:** Required (JWT)
- **Description:** Verify OTP and mark email as verified
- **Parameters:**
  - `otp` (path): 6-digit OTP code
- **Response:**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "emailVerified": true
    }
  }
}
```

### User Management

#### Get User Profile

- **GET** `/users/profile`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Get current user's profile information
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
    "apiKeys": [
      {
        "id": "key_id",
        "apiAccessKeyId": "access_key_id",
        "name": "My API Key",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastUsedAt": "2024-01-02T00:00:00.000Z",
        "revokedAt": null
      }
    ]
  }
}
```

#### Update User Profile

- **PUT** `/users/profile`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Update user profile information
- **Body:**

```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
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
      "email": "newemail@example.com",
      "name": "Updated Name",
      "role": "USER",
      "emailVerified": false,
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

#### Change Password

- **POST** `/users/change-password`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Change user password
- **Body:**

```json
{
  "currentPassword": "oldpassword123",
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
- **Auth:** Required (JWT + Email Verification)
- **Description:** Get comprehensive account summary with usage data
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
    "apiKeys": [
      {
        "id": "key_id",
        "apiAccessKeyId": "access_key_id",
        "name": "My API Key",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastUsedAt": "2024-01-02T00:00:00.000Z",
        "revokedAt": null,
        "quota": {
          "usage": {
            "gbsUsed": "0.45",
            "objects": 123,
            "lastUpdated": "2024-01-02T00:00:00.000Z"
          },
          "quota": {
            "maxGbs": "5.00",
            "maxObjects": 10000,
            "canUpload": true,
            "quotaExceeded": false
          }
        }
      }
    ]
  }
}
```

#### Delete Account

- **DELETE** `/users/account`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Delete user account and mark for data removal
- **Response:**

```json
{
  "success": true,
  "message": "Account deletion initiated. All data will be removed within 30 days.",
  "data": {}
}
```

### API Key Management

#### List API Keys

- **GET** `/apiKeys/`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Get all API keys for the current user
- **Response:**

```json
{
  "success": true,
  "message": "API keys retrieved successfully",
  "data": [
    {
      "id": "key_id",
      "apiAccessKeyId": "access_key_id",
      "name": "My API Key",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastUsedAt": "2024-01-02T00:00:00.000Z",
      "revokedAt": null
    }
  ]
}
```

#### Get API Key Details

- **GET** `/apiKeys/:id`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Get detailed information about a specific API key
- **Response:**

```json
{
  "success": true,
  "message": "API key retrieved successfully",
  "data": {
    "id": "key_id",
    "apiAccessKeyId": "access_key_id",
    "name": "My API Key",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastUsedAt": "2024-01-02T00:00:00.000Z",
    "revokedAt": null
  }
}
```

#### Revoke API Key

- **DELETE** `/apiKeys/:id`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Revoke/deactivate an API key
- **Response:**

```json
{
  "success": true,
  "message": "API key revoked successfully",
  "data": {
    "id": "key_id",
    "revokedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

### API Key Request Management

#### Get User's API Key Requests

- **GET** `/apiKeys/request`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Get all API key requests for the current user
- **Response:**

```json
{
  "success": true,
  "message": "API key requests retrieved successfully",
  "data": [
    {
      "id": "request_id",
      "requestType": "CREATE",
      "keyName": "My New API Key",
      "requestedStorageGB": 5,
      "requestedObjects": 10000,
      "reason": "Need storage for my application data",
      "status": "PENDING",
      "reviewerComment": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "reviewedAt": null
    }
  ]
}
```

#### Create API Key Request

- **POST** `/apiKeys/request/create`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Request creation of a new API key with specific quotas
- **Body:**

```json
{
  "keyName": "My New API Key",
  "requestedStorageGB": 5,
  "requestedObjects": 10000,
  "reason": "Need additional storage for my application data backup and file sharing features"
}
```

- **Response:**

```json
{
  "success": true,
  "message": "API key creation request submitted successfully",
  "data": {
    "request": {
      "id": "request_id",
      "requestType": "CREATE",
      "keyName": "My New API Key",
      "requestedStorageGB": 5,
      "requestedObjects": 10000,
      "reason": "Need additional storage for my application data backup and file sharing features",
      "status": "PENDING",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Create API Key Upgrade Request

- **POST** `/apiKeys/request/upgrade`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Request quota upgrade for an existing API key
- **Body:**

```json
{
  "apiAccessKeyId": "existing_access_key_id",
  "requestedStorageGB": 10,
  "requestedObjects": 20000,
  "reason": "Current quota is insufficient for growing application needs"
}
```

- **Response:**

```json
{
  "success": true,
  "message": "API key upgrade request submitted successfully",
  "data": {
    "request": {
      "id": "request_id",
      "requestType": "UPGRADE",
      "apiAccessKeyId": "existing_access_key_id",
      "requestedStorageGB": 10,
      "requestedObjects": 20000,
      "reason": "Current quota is insufficient for growing application needs",
      "status": "PENDING",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Get API Key Request Details

- **GET** `/apiKeys/request/:id`
- **Auth:** Required (JWT + Email Verification)
- **Description:** Get detailed information about a specific API key request
- **Response:**

```json
{
  "success": true,
  "message": "API key request retrieved successfully",
  "data": {
    "request": {
      "id": "request_id",
      "requestType": "CREATE",
      "keyName": "My New API Key",
      "requestedStorageGB": 5,
      "requestedObjects": 10000,
      "reason": "Need additional storage for my application data backup",
      "status": "APPROVED",
      "reviewerComment": "Approved for legitimate business use",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "reviewedAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

### File Storage

**Note:** All storage endpoints require API key authentication only. JWT authentication is not supported for storage operations.

#### Upload File

- **POST** `/storage/upload`
- **Auth:** Required (API Key only)
- **Description:** Upload a file to storage
- **Content-Type:** `multipart/form-data`
- **Body:** Form data with file field
- **Response:**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "fileName": "document.pdf",
      "originalName": "my-document.pdf",
      "size": 1048576,
      "contentType": "application/pdf",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "downloadUrl": "https://s3.amazonaws.com/bucket/apikeys/access_key_id/document.pdf"
    },
    "usage": {
      "totalFiles": 124,
      "totalSizeBytes": 5368709120,
      "quotaUsagePercentage": {
        "storage": 50.2,
        "objects": 1.24
      }
    }
  }
}
```

#### List Files

- **GET** `/storage/files`
- **Auth:** Required (API Key only)
- **Description:** List all files in storage
- **Query Parameters:**
  - `limit` (optional): Number of files to return (default: 50, max: 100)
  - `offset` (optional): Number of files to skip (default: 0)
  - `search` (optional): Search files by name
- **Response:**

```json
{
  "success": true,
  "message": "Files retrieved successfully",
  "data": {
    "files": [
      {
        "fileName": "document.pdf",
        "originalName": "my-document.pdf",
        "size": 1048576,
        "contentType": "application/pdf",
        "uploadedAt": "2024-01-01T00:00:00.000Z",
        "lastModified": "2024-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "total": 124,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Get File

- **GET** `/storage/files/:fileName`
- **Auth:** Required (API Key only)
- **Description:** Get presigned URL for file download
- **Response:**

```json
{
  "success": true,
  "message": "File URL generated successfully",
  "data": {
    "fileName": "document.pdf",
    "downloadUrl": "https://s3.amazonaws.com/bucket/apikeys/access_key_id/document.pdf",
    "expiresIn": 3600
  }
}
```

#### Get File Metadata

- **GET** `/storage/files/:fileName/metadata`
- **Auth:** Required (API Key only)
- **Description:** Get detailed metadata for a specific file
- **Response:**

```json
{
  "success": true,
  "message": "File metadata retrieved successfully",
  "data": {
    "file": {
      "fileName": "document.pdf",
      "originalName": "my-document.pdf",
      "size": 1048576,
      "contentType": "application/pdf",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "lastModified": "2024-01-01T00:00:00.000Z",
      "category": "document",
      "extension": "pdf"
    }
  }
}
```

#### Delete File

- **DELETE** `/storage/files/:fileName`
- **Auth:** Required (API Key only)
- **Description:** Delete a specific file
- **Response:**

```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "fileName": "document.pdf",
    "deletedAt": "2024-01-02T00:00:00.000Z",
    "sizeFreed": 1048576
  }
}
```

#### Bulk Delete Files

- **POST** `/storage/files/bulk-delete`
- **Auth:** Required (API Key only)
- **Description:** Delete multiple files at once
- **Body:**

```json
{
  "fileNames": ["file1.pdf", "file2.jpg", "file3.docx"]
}
```

- **Response:**

```json
{
  "success": true,
  "message": "Bulk delete completed",
  "data": {
    "deleted": ["file1.pdf", "file2.jpg"],
    "failed": [
      {
        "fileName": "file3.docx",
        "reason": "File not found"
      }
    ],
    "summary": {
      "totalRequested": 3,
      "successfullyDeleted": 2,
      "failed": 1,
      "spaceFreed": 2097152
    }
  }
}
```

#### Get Storage Usage

- **GET** `/storage/usage`
- **Auth:** Required (API Key only)
- **Description:** Get current storage usage and quota information
- **Response:**

```json
{
  "success": true,
  "message": "Storage usage retrieved successfully",
  "data": {
    "usage": {
      "bytesUsed": 5368709120,
      "objects": 124,
      "lastUpdated": "2024-01-02T00:00:00.000Z"
    },
    "quota": {
      "maxBytes": 10737418240,
      "maxObjects": 10000,
      "canUpload": true,
      "quotaExceeded": false
    },
    "usagePercentage": {
      "bytes": 50.0,
      "objects": 1.24
    }
  }
}
```

#### Get Storage Analytics

- **GET** `/storage/analytics`
- **Auth:** Required (API Key only)
- **Description:** Get detailed storage analytics and insights
- **Response:**

```json
{
  "success": true,
  "message": "Storage analytics retrieved successfully",
  "data": {
    "overview": {
      "totalFiles": 124,
      "totalSizeGB": 5.0,
      "averageFileSize": 41943040,
      "largestFile": {
        "fileName": "video.mp4",
        "size": 104857600
      }
    },
    "fileTypes": {
      "documents": { "count": 45, "sizeBytes": 2147483648 },
      "images": { "count": 67, "sizeBytes": 1073741824 },
      "videos": { "count": 8, "sizeBytes": 1610612736 },
      "others": { "count": 4, "sizeBytes": 536870912 }
    },
    "recentFiles": [
      {
        "fileName": "recent-upload.pdf",
        "size": 1048576,
        "uploadedAt": "2024-01-02T00:00:00.000Z"
      }
    ],
    "quota": {
      "usagePercentage": 50.0,
      "remainingGB": 5.0,
      "daysUntilFull": 45
    }
  }
}
```

### Admin Dashboard

**Note:** All admin endpoints require JWT authentication with admin role.

#### Get System Health

- **GET** `/admin/health`
- **Auth:** Required (JWT + Admin)
- **Description:** Get system health and statistics
- **Response:**

```json
{
  "success": true,
  "message": "System health retrieved successfully",
  "data": {
    "system": {
      "status": "healthy",
      "uptime": 86400,
      "timestamp": "2024-01-02T00:00:00.000Z"
    },
    "statistics": {
      "users": {
        "total": 150,
        "verified": 120,
        "admins": 2,
        "recent": 15
      },
      "apiKeys": {
        "total": 89,
        "active": 67,
        "revoked": 22,
        "utilizationRate": "75.28"
      },
      "requests": {
        "pending": 5,
        "approved": 45,
        "rejected": 8,
        "total": 58
      }
    }
  }
}
```

#### Get User Analytics

- **GET** `/admin/users`
- **Auth:** Required (JWT + Admin)
- **Description:** Get detailed user analytics
- **Query Parameters:**
  - `limit` (optional): Number of users to return (default: 50)
  - `offset` (optional): Number of users to skip (default: 0)
- **Response:**

```json
{
  "success": true,
  "message": "User analytics retrieved successfully",
  "data": [
    {
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "USER",
        "emailVerified": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "apiKeys": {
        "total": 2,
        "active": 1,
        "revoked": 1
      },
      "requests": {
        "total": 3,
        "pending": 0,
        "approved": 2,
        "rejected": 1
      },
      "activity": {
        "lastLogin": "2024-01-02T00:00:00.000Z",
        "totalLogins": 15
      }
    }
  ]
}
```

#### Get API Key Overview

- **GET** `/admin/api-keys`
- **Auth:** Required (JWT + Admin)
- **Description:** Get comprehensive API key overview for all users
- **Response:**

```json
{
  "success": true,
  "message": "API key overview retrieved successfully",
  "data": [
    {
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "apiKeys": [
        {
          "id": "key_id",
          "accessKeyId": "access_key_id",
          "name": "Production API",
          "isActive": true,
          "createdAt": "2024-01-01T00:00:00.000Z",
          "lastUsedAt": "2024-01-02T00:00:00.000Z",
          "revokedAt": null
        }
      ]
    }
  ]
}
```

#### Get Audit Logs

- **GET** `/admin/audit-logs`
- **Auth:** Required (JWT + Admin)
- **Description:** Get system audit logs
- **Query Parameters:**
  - `limit` (optional): Number of logs to return (default: 50)
  - `offset` (optional): Number of logs to skip (default: 0)
  - `action` (optional): Filter by specific action type
- **Response:**

```json
{
  "success": true,
  "message": "Audit logs retrieved successfully",
  "data": [
    {
      "id": "log_id",
      "action": "USER_LOGIN",
      "userId": "user_id",
      "apiAccessKeyId": null,
      "detail": "User logged in successfully",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

### Admin API Key Request Management

#### Get All API Key Requests (Admin)

- **GET** `/apiKeys/request/admin/all`
- **Auth:** Required (JWT + Admin)
- **Description:** Get all API key requests across all users
- **Query Parameters:**
  - `status` (optional): Filter by status (PENDING, APPROVED, REJECTED)
  - `limit` (optional): Number of results (default: 50)
  - `offset` (optional): Offset for pagination (default: 0)
- **Response:**

```json
{
  "success": true,
  "message": "API key requests retrieved successfully",
  "data": {
    "requests": [
      {
        "id": "request_id",
        "user": {
          "id": "user_id",
          "email": "user@example.com",
          "name": "John Doe"
        },
        "requestType": "CREATE",
        "keyName": "Production API",
        "requestedStorageGB": 5,
        "requestedObjects": 10000,
        "reason": "Need additional storage for my application data backup",
        "status": "PENDING",
        "reviewerComment": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "reviewedAt": null
      }
    ],
    "meta": {
      "total": 58,
      "pending": 5,
      "approved": 45,
      "rejected": 8
    }
  }
}
```

#### Review API Key Request (Admin)

- **PATCH** `/apiKeys/request/admin/review/:id`
- **Auth:** Required (JWT + Admin)
- **Description:** Approve or reject an API key request
- **Body:**

```json
{
  "approved": true,
  "reviewerComment": "Approved for legitimate business use"
}
```

- **Response:**

```json
{
  "success": true,
  "message": "API key request approved successfully",
  "data": {
    "request": {
      "id": "request_id",
      "status": "APPROVED",
      "reviewerComment": "Approved for legitimate business use",
      "reviewedAt": "2024-01-02T00:00:00.000Z"
    },
    "apiKey": {
      "id": "key_id",
      "accessKeyId": "new_access_key_id",
      "secretKey": "new_secret_key",
      "name": "Production API"
    }
  }
}
```

### Public Endpoints

#### Health Check

- **GET** `/open/health`
- **Auth:** None
- **Description:** Check if the API is running and healthy
- **Response:**

```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-02T00:00:00.000Z",
    "version": "1.0.0"
  }
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details",
    "httpStatusCode": 400
  }
}
```

### Common Error Status Codes

- **400 Bad Request:** Invalid input data or malformed request
- **401 Unauthorized:** Missing or invalid authentication
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **409 Conflict:** Resource already exists or conflict
- **413 Payload Too Large:** File size exceeds limits
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Server-side error

## Rate Limiting

- **Authentication endpoints:** 5 requests per minute per IP
- **Storage uploads:** 100 requests per hour per API key
- **General API calls:** 1000 requests per hour per authenticated user

## File Size Limits

- **Maximum file size:** 100MB per file
- **Supported formats:** All file types are supported
- **Storage quotas:** Based on approved API key requests

## SDK and Integration Examples

### cURL Examples

```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Upload a file using API key
curl -X POST http://localhost:8080/api/storage/upload \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key" \
  -F "file=@document.pdf"

# Get storage usage
curl -X GET http://localhost:8080/api/storage/usage \
  -H "x-access-key-id: your_access_key_id" \
  -H "x-secret-key: your_secret_key"
```

### JavaScript/Node.js Example

```javascript
// Upload file with fetch
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("http://localhost:8080/api/storage/upload", {
  method: "POST",
  headers: {
    "x-access-key-id": "your_access_key_id",
    "x-secret-key": "your_secret_key",
  },
  body: formData,
});

const result = await response.json();
console.log(result);
```

## Support

For API support and questions, please contact the development team or check the repository documentation.
