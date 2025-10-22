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
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  accessKeyId: string;
  secretHash?: string;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface ApiKeyAnalytics {
  summary: {
    totalObjectsUploaded: number;
    totalStorageUsed: number;
    totalStorageLimit: number;
    totalObjectsLimit: number;
    usagePercentage: {
      bytes: number;
      objects: number;
    };
  };
  fileTypeBreakdown: Array<{
    category: string;
    count: number;
    totalSize: number;
    percentage: number;
  }>;
  recentFiles: Array<{
    key: string;
    size: number;
    category: string;
    lastModified: Date;
  }>;
}

// ============================================================================
// API KEY REQUEST TYPES
// ============================================================================

export interface ApiKeyRequestItem {
  id: string;
  requestedStorage: number;
  requestedObjects: number;
  currentStorage?: number;
  currentObjects?: number;
  reason: string | null;
  keyName?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  accessKeyId?: string;
  requestType: "CREATE" | "UPGRADE";
  reviewerComment: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
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
  apiKeysWithStats: {
    id: string;
    accessKeyId: string;
    name: string | null;
    isActive: boolean;
    createdAt: Date;
    lastUsedAt: Date | null;
    revokedAt: Date | null;
    stats: Array<{
      bytesUsed: number;
      objects: number;
      storageLimit: number;
      objectsLimit: number;
      lastUpdated: Date;
      usagePercentage: {
        bytes: number;
        objects: number;
      };
    }>;
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
  createdAt: Date;
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
    timestamp: Date;
  };
  userStatistics: {
    total: number;
    admins: number;
    recentSignups: number;
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
  apiKeyRequestStatistics: {
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
  createdAt: Date;
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
  id: string;
  accessKeyId: string;
  apiKeyName: string | null;
  summary: {
    totalObjectsUploaded: number;
    totalStorageUsed: number;
    totalStorageLimit: number;
    totalObjectsLimit: number;
    usagePercentage: {
      bytes: number;
      objects: number;
    };
  };
  fileTypeBreakdown: {
    category: string;
    count: number;
    totalSize: number;
    totalSizeFormatted: string;
    percentage: number;
  }[];
  recentFiles: {
    key: string;
    size: number;
    sizeFormatted: string;
    lastModified: Date;
    category: string;
  }[];
}

export interface ApiKeyOverview {
  apiKeys: ApiKeyOverviewItem[];
  pagination: {
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    totalItems: number;
  };
}

// ============================================================================
// REQUEST TYPES (for API calls)
// ============================================================================

export interface CreateApiKeyRequest {
  keyName: string;
  requestedStorageGB: number;
  requestedObjects: number;
  reason: string;
}

export interface UpgradeApiKeyRequest {
  accessKeyId: string;
  requestedStorageGB: number;
  requestedObjects: number;
  reason: string;
}

export interface ReviewApiKeyRequest {
  approved: boolean;
  reviewerComment?: string;
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
