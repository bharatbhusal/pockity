// API Types for Backend Integration

export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  tier: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
  status: "ACTIVE" | "REVOKED" | "SUSPENDED";
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  requestsPerDay: number;
  requestsPerMonth: number;
  storageLimit: number;
}

export interface ApiKeyRequest {
  id: string;
  userId: string;
  keyName: string;
  requestType: "CREATE" | "UPGRADE";
  requestedTier: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
  currentTier?: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  apiKeyId: string;
  totalRequests: number;
  totalStorage: number;
  totalObjects: number;
  requestsToday: number;
  requestsThisMonth: number;
  storageUsed: number;
  lastReset: string;
}

export interface AccountSummary {
  user: User;
  apiKeys: ApiKey[];
  usage: UsageStats[];
  totalRequests: number;
  totalStorage: number;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "down";
  uptime: number;
  totalUsers: number;
  totalApiKeys: number;
  totalRequests: number;
  totalStorage: number;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  usersByTier: Record<string, number>;
  users: (User & { apiKeysCount: number; totalRequests: number })[];
}

export interface ApiKeyOverview {
  totalApiKeys: number;
  activeApiKeys: number;
  revokedApiKeys: number;
  apiKeysByTier: Record<string, number>;
  pendingRequests: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: User;
}

// Request/Response Types
export interface LoginRequest {
  email: string;
}

export interface VerifyLoginRequest {
  email: string;
  otp: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name?: string;
}

export interface VerifyRegisterRequest {
  email: string;
  otp: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token?: string;
  };
}

export interface CreateApiKeyRequest {
  keyName: string;
  requestedTier: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
  reason: string;
}

export interface UpgradeApiKeyRequest {
  apiKeyId: string;
  requestedTier: "BASIC" | "PREMIUM" | "ENTERPRISE";
  reason: string;
}

export interface ReviewApiKeyRequest {
  status: "APPROVED" | "REJECTED";
  reviewComment?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  profilePicture?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
