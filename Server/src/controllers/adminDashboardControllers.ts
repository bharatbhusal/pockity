import { Request, Response, NextFunction } from "express";
import { UserRepository, ApiKeyRepository, AuditLogRepository, ApiKeyRequestRepository } from "../repositories";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { API_REQUEST_STATUS, AuditAction, AuditLogService } from "../services/auditLogService";
import { S3Service } from "../services/s3Service";
import { UsageService } from "../services/usageService";
import { formatFileSize } from "../utils/storageHelpher";

// Get overall system health and statistics
export const getSystemHealthController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.adminUser;

    // Get basic system statistics
    const [users, apiKeys, auditLogs, apiKeyRequests] = await Promise.all([
      UserRepository.list(),
      ApiKeyRepository.list(),
      AuditLogRepository.list(),
      ApiKeyRequestRepository.list(),
    ]);

    // Calculate user statistics
    const totalUsers = users.length;
    const adminUsers = users.filter((user: any) => user.role === "ADMIN").length;
    const recentUsers = users.filter((user: any) => {
      const userDate = new Date(user.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return userDate > sevenDaysAgo;
    }).length;

    // Calculate API key statistics
    const totalApiKeys = apiKeys.length;
    const activeApiKeys = apiKeys.filter((key: any) => key.isActive && !key.revokedAt).length;
    const revokedApiKeys = apiKeys.filter((key: any) => key.revokedAt).length;

    // Calculate recent activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAuditLogs = auditLogs.filter((log: any) => new Date(log.createdAt) > sevenDaysAgo);

    // API key request statistics
    const pendingRequests = apiKeyRequests.filter((req: any) => req.status === API_REQUEST_STATUS.PENDING).length;
    const approvedRequests = apiKeyRequests.filter((req: any) => req.status === API_REQUEST_STATUS.APPROVED).length;
    const rejectedRequests = apiKeyRequests.filter((req: any) => req.status === API_REQUEST_STATUS.REJECTED).length;

    // Log admin access
    await AuditLogService.logAdminAction({
      adminId: admin.id,
      action: AuditAction.VIEW_SYSTEM_HEALTH,
      details: "Accessed system health dashboard",
    });

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "System health retrieved successfully",
        data: {
          systemHealth: {
            status: "healthy", // In a real system, you'd implement actual health checks
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          },
          userStatistics: {
            total: totalUsers,
            admins: adminUsers,
            recentSignups: recentUsers,
          },
          apiKeyStatistics: {
            total: totalApiKeys,
            active: activeApiKeys,
            revoked: revokedApiKeys,
            utilizationRate: totalApiKeys > 0 ? ((activeApiKeys / totalApiKeys) * 100).toFixed(2) : 0,
          },
          activityStatistics: {
            recentActions: recentAuditLogs.length,
            totalAuditLogs: auditLogs.length,
          },
          apiKeyRequestStatistics: {
            pending: pendingRequests,
            approved: approvedRequests,
            rejected: rejectedRequests,
            total: apiKeyRequests.length,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get detailed user analytics
export const getUserAnalyticsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.adminUser;

    const { limit = 50, offset = 0 } = req.query;

    const users = await UserRepository.list();

    // Enhanced user analytics with API key and request data
    const userAnalytics = await Promise.all(
      users.slice(Number(offset), Number(offset) + Number(limit)).map(async (user: any) => {
        const userApiKeys = await ApiKeyRepository.findByUserId(user.id);
        const userRequests = await ApiKeyRequestRepository.findByUserId(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          statistics: {
            apiKeys: {
              total: userApiKeys.length,
              active: userApiKeys.filter((key: any) => key.isActive && !key.revokedAt).length,
              revoked: userApiKeys.filter((key: any) => key.revokedAt).length,
            },
            requests: {
              total: userRequests.length,
              pending: userRequests.filter((req: any) => req.status === API_REQUEST_STATUS.PENDING).length,
              approved: userRequests.filter((req: any) => req.status === API_REQUEST_STATUS.APPROVED).length,
              rejected: userRequests.filter((req: any) => req.status === API_REQUEST_STATUS.REJECTED).length,
            },
          },
        };
      }),
    );

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "User analytics retrieved successfully",
        data: {
          users: userAnalytics,
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            total: users.length,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get system audit logs with filtering
export const getSystemAuditLogsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.adminUser;

    const { action, userId, limit = 100, offset = 0 } = req.query;

    // Get audit logs (in a real implementation, you'd add filtering to the repository)
    const allLogs = await AuditLogRepository.list();

    let filteredLogs = allLogs;

    // Apply filters
    if (action && typeof action === "string") {
      filteredLogs = filteredLogs.filter((log: any) => log.action === action);
    }

    if (userId && typeof userId === "string") {
      filteredLogs = filteredLogs.filter((log: any) => log.actorId === userId);
    }

    // Sort by most recent first
    filteredLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const paginatedLogs = filteredLogs.slice(Number(offset), Number(offset) + Number(limit));

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Audit logs retrieved successfully",
        data: {
          auditLogs: paginatedLogs,
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            total: filteredLogs.length,
          },
          filters: {
            action,
            userId,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get storage analytics for multiple API keys with pagination, offset, and filter
export const getApiKeyOverviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0; // Added offset support
    const search = (req.query.search as string)?.toLowerCase() || "";

    // Get all API keys
    let apiKeys = await ApiKeyRepository.list();

    // Filter by search if provided
    if (search) {
      apiKeys = apiKeys.filter(
        (key) => key.name?.toLowerCase().includes(search) || key.accessKeyId?.toLowerCase().includes(search),
      );
    }

    // Pagination calculation with offset
    const totalItems = apiKeys.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = offset > 0 ? offset : (page - 1) * limit;
    const paginatedKeys = apiKeys.slice(startIndex, startIndex + limit);

    // Fetch analytics for paginated keys in parallel
    const analytics = await Promise.all(
      paginatedKeys.map(async (apiKey) => {
        const [files, usageData] = await Promise.all([
          S3Service.listUserFiles(apiKey.accessKeyId),
          UsageService.getUsageWithQuota(apiKey.accessKeyId),
        ]);

        // Analyze file types
        const fileTypeAnalysis: Record<string, { count: number; totalSize: number }> = {};
        let totalSize = 0;

        for (const file of files) {
          const category = file.contentType?.split("/")[0] || "Unknown";
          if (!fileTypeAnalysis[category]) fileTypeAnalysis[category] = { count: 0, totalSize: 0 };

          fileTypeAnalysis[category].count++;
          fileTypeAnalysis[category].totalSize += file.sizeInBytes;
          totalSize += file.sizeInBytes;
        }

        const fileTypeBreakdown = Object.entries(fileTypeAnalysis).map(([category, data]) => ({
          category,
          count: data.count,
          totalSize: data.totalSize,
          totalSizeFormatted: formatFileSize(data.totalSize),
          percentage: totalSize > 0 ? Math.round((data.totalSize / totalSize) * 100) : 0,
        }));

        return {
          id: apiKey.id,
          accessKeyId: apiKey.accessKeyId,
          apiKeyName: apiKey.name,
          summary: {
            totalObjectsUploaded: files.length,
            totalStorageUsed: Number(usageData.usage.bytesUsed),
            totalStorageLimit: Number(apiKey.totalStorage),
            totalObjectsLimit: apiKey.totalObjects,
            usagePercentage: usageData.usagePercentage,
          },
          fileTypeBreakdown,
          recentFiles: files
            .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
            .slice(0, 10)
            .map((file) => ({
              key: file.key,
              size: file.sizeInBytes,
              sizeFormatted: formatFileSize(file.sizeInBytes),
              lastModified: file.lastModified,
              category: file.contentType?.split("/")[0] || "Unknown",
            })),
        };
      }),
    );

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Storage analytics retrieved successfully",
        data: {
          analytics,
          pagination: {
            page,
            limit,
            offset,
            totalPages,
            totalItems,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};
