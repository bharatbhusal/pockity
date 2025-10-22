// ============================================================================
// POCKITY API TYPES - Matching Backend Response Structures
// ============================================================================

// ============================================================================
// BASE RESPONSE STRUCTURE (from PockityBaseResponse)
// ============================================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  role: "USER" | "ADMIN";
  picture?: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  accessKeyId: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

// Extended ApiKey with usage info (from storage APIs)
export interface ApiKeyWithUsage extends ApiKey {
  totalStorage: number;
  totalObjects: number;
  currentBytesUsed?: number;
  currentObjects?: number;
}

// ============================================================================
// API KEY REQUEST TYPES
// ============================================================================

export interface ApiKeyRequestItem {
  id: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  requestType: "CREATE" | "UPGRADE";
  keyName: string | null;
  apiAccessKeyId: string | null;
  requestedStorageGB: number;
  requestedObjects: number;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewerComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyRequestsResponse {
  requests: ApiKeyRequestItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// ============================================================================
// USER PROFILE & ACCOUNT
// ============================================================================

export interface UserProfileData {
  user: User;
  apiKeys: ApiKey[];
}

export interface AccountSummary {
  user: User;
  totalApiKeys: number;
  activeApiKeys: number;
  totalRequests: number;
  totalStorage: number;
  recentActivity: {
    lastLogin: string | null;
    lastApiKeyCreated: string | null;
  };
}

// ============================================================================
// USAGE & ANALYTICS
// ============================================================================

export interface UsageStats {
  apiAccessKeyId: string;
  bytesUsed: number;
  objects: number;
  storageLimit: number;
  objectsLimit: number;
  storageUsagePercent: number;
  objectsUsagePercent: number;
  lastUpdated: string;
}

export interface AuditLog {
  id: string;
  apiAccessKeyId: string | null;
  actorId: string | null;
  action: string;
  detail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  auditLogs: AuditLog[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  filters: {
    action?: string;
    userId?: string;
  };
}

// ============================================================================
// ADMIN DASHBOARD TYPES
// ============================================================================

export interface SystemHealth {
  systemHealth: {
    status: "healthy" | "degraded" | "down";
    uptime: number;
    timestamp: string;
  };
  userStatistics: {
    total: number;
    verified: number;
    admins: number;
    recentSignups: number;
    verificationRate: string;
  };
  apiKeyStatistics: {
    total: number;
    active: number;
    revoked: number;
    utilizationRate: string;
  };
  activityStatistics: {
    recentActions: number;
    totalAuditLogs: number;
  };
  requestStatistics: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}

export interface UserWithStats {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  statistics: {
    apiKeys: {
      total: number;
      active: number;
      revoked: number;
    };
    requests: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  };
}

export interface UserAnalytics {
  users: UserWithStats[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface ApiKeyOverviewItem {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  apiKeys: Array<{
    id: string;
    accessKeyId: string;
    name: string | null;
    isActive: boolean;
    createdAt: string;
    lastUsedAt: string | null;
    revokedAt: string | null;
  }>;
}

export interface ApiKeyOverview {
  overview: ApiKeyOverviewItem[];
  summary: {
    totalUsers: number;
    totalApiKeys: number;
    activeKeys: number;
    revokedKeys: number;
  };
}

// ============================================================================
// REQUEST TYPES (for API calls)
// ============================================================================

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface CreateApiKeyRequest {
  keyName: string;
  requestedStorageGB: number;
  requestedObjects: number;
  reason: string;
}

export interface UpgradeApiKeyRequest {
  apiAccessKeyId: string;
  requestedStorageGB: number;
  requestedObjects: number;
  reason: string;
}

export interface ReviewApiKeyRequest {
  approved: boolean;
  reviewerComment?: string;
}

// ============================================================================
// LEGACY/DEPRECATED TYPES (for backward compatibility)
// ============================================================================

// Old ApiKey type that some components might still use
export interface LegacyApiKey {
  id: string;
  key: string; // Maps to apiAccessKeyId
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

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

export function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
  return typeof obj === "object" && obj !== null && "success" in obj && "message" in obj;
}

export function isErrorResponse(obj: unknown): obj is ApiResponse<never> {
  return isApiResponse(obj) && obj.success === false;
}
