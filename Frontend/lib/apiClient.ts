import API from "@/lib/axios";
import type {
  ApiKey,
  ApiKeyRequestsResponse,
  ApiKeyOverview,
  ApiResponse,
  AccountSummary,
  AuditLogsResponse,
  CreateApiKeyRequest,
  ReviewApiKeyRequest,
  SystemHealth,
  UpdateProfileRequest,
  UpgradeApiKeyRequest,
  User,
  UserAnalytics,
  UserProfileData,
  UsageStats,
  ApiKeyRequestItem,
} from "@/types/api";

// =====================
// Authentication APIs
// =====================

export const authApi = {
  /**
   * Get Google OAuth URL
   */
  getGoogleOAuthUrl: async () => {
    const response = await API.get<ApiResponse<{ url: string }>>("/auth/oauth-url");
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const response = await API.post<ApiResponse<null>>("/auth/logout");
    return response.data;
  },
};

// =====================
// User APIs
// =====================

export const userApi = {
  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await API.get<ApiResponse<UserProfileData>>("/users/profile");
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await API.put<ApiResponse<{ user: User }>>("/users/profile", data);
    return response.data;
  },

  /**
   * Get account summary (user + api keys + usage)
   */
  getAccountSummary: async () => {
    const response = await API.get<ApiResponse<AccountSummary>>("/users/summary");
    return response.data;
  },

  /**
   * Delete user account
   */
  deleteAccount: async () => {
    const response = await API.delete<ApiResponse<null>>("/users/account");
    return response.data;
  },
};

// =====================
// API Key APIs
// =====================

export const apiKeyApi = {
  /**
   * List all user's API keys
   */
  listApiKeys: async () => {
    const response = await API.get<ApiResponse<ApiKey[]>>("/apiKeys");
    return response.data;
  },

  /**
   * Get specific API key details
   */
  getApiKey: async (id: string) => {
    const response = await API.get<ApiResponse<ApiKey>>(`/apiKeys/${id}`);
    return response.data;
  },

  /**
   * Revoke an API key
   */
  revokeApiKey: async (id: string) => {
    const response = await API.delete<ApiResponse<null>>(`/apiKeys/${id}`);
    return response.data;
  },

  /**
   * Get user's API key requests
   */
  getUserRequests: async () => {
    const response = await API.get<ApiResponse<ApiKey[]>>("/apiKeys/request");
    return response.data;
  },

  /**
   * Create new API key request
   */
  createKeyRequest: async (data: CreateApiKeyRequest) => {
    const response = await API.post<ApiResponse<ApiKeyRequestItem>>("/apiKeys/request/create", data);
    return response.data;
  },

  /**
   * Request API key upgrade
   */
  upgradeKeyRequest: async (data: UpgradeApiKeyRequest) => {
    const response = await API.post<ApiResponse<ApiKeyRequestItem>>("/apiKeys/request/upgrade", data);
    return response.data;
  },

  /**
   * Get specific API key request details
   */
  getKeyRequest: async (id: string) => {
    const response = await API.get<ApiResponse<ApiKeyRequestItem>>(`/apiKeys/request/${id}`);
    return response.data;
  },
};

// =====================
// Admin APIs
// =====================

export const adminApi = {
  /**
   * Get all API key requests (admin only)
   */
  getAllApiKeyRequests: async () => {
    const response = await API.get<ApiResponse<ApiKeyRequestsResponse>>("/apiKeys/request/admin/all");
    return response.data;
  },

  /**
   * Review an API key request (admin only)
   */
  reviewApiKeyRequest: async (id: string, data: ReviewApiKeyRequest) => {
    const response = await API.patch<ApiResponse<ApiKeyRequestItem>>(`/apiKeys/request/admin/review/${id}`, data);
    return response.data;
  },

  /**
   * Get system health status
   */
  getSystemHealth: async () => {
    const response = await API.get<ApiResponse<SystemHealth>>("/admin/health");
    return response.data;
  },

  /**
   * Get user analytics
   */
  getUserAnalytics: async () => {
    const response = await API.get<ApiResponse<UserAnalytics>>("/admin/users");
    return response.data;
  },

  /**
   * Get API key overview
   */
  getApiKeyOverview: async () => {
    const response = await API.get<ApiResponse<ApiKeyOverview>>("/admin/apiKeyss");
    return response.data;
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async (params?: { action?: string; userId?: string; limit?: number; offset?: number }) => {
    const response = await API.get<ApiResponse<AuditLogsResponse>>("/admin/audit-logs", { params });
    return response.data;
  },
};

// =====================
// Storage APIs
// =====================

export const storageApi = {
  /**
   * Get usage statistics for an API key
   */
  getUsageStats: async (apiKeyId: string) => {
    const response = await API.get<ApiResponse<UsageStats>>(`/storage/usage/${apiKeyId}`);
    return response.data;
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  user: userApi,
  apiKey: apiKeyApi,
  admin: adminApi,
  storage: storageApi,
};

export default api;
