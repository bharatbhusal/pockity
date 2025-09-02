import { Request, Response, NextFunction } from "express";
import { UserRepository, ApiKeyRepository, AuditLogRepository, ApiKeyRequestRepository } from "../repositories";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { AuditLogService } from "../services/auditLogService";


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
    const verifiedUsers = users.filter((user: any) => user.emailVerified).length;
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
    const pendingRequests = apiKeyRequests.filter((req: any) => req.status === "PENDING").length;
    const approvedRequests = apiKeyRequests.filter((req: any) => req.status === "APPROVED").length;
    const rejectedRequests = apiKeyRequests.filter((req: any) => req.status === "REJECTED").length;

    // Log admin access
    await AuditLogService.logAdminAction({
      adminId: admin.id,
      action: "VIEW_SYSTEM_HEALTH",
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
            verified: verifiedUsers,
            admins: adminUsers,
            recentSignups: recentUsers,
            verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0,
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
          requestStatistics: {
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
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          statistics: {
            apiKeys: {
              total: userApiKeys.length,
              active: userApiKeys.filter((key: any) => key.isActive && !key.revokedAt).length,
              revoked: userApiKeys.filter((key: any) => key.revokedAt).length,
            },
            requests: {
              total: userRequests.length,
              pending: userRequests.filter((req: any) => req.status === "PENDING").length,
              approved: userRequests.filter((req: any) => req.status === "APPROVED").length,
              rejected: userRequests.filter((req: any) => req.status === "REJECTED").length,
            },
          },
        };
      }),
    );

    // Log admin access
    await AuditLogService.logAdminAction({
      adminId: admin.id,
      action: "VIEW_USER_ANALYTICS",
      details: "Accessed user analytics dashboard",
      metadata: { limit, offset },
      
    });

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

    // Log admin access
    await AuditLogService.logAdminAction({
      adminId: admin.id,
      action: "VIEW_AUDIT_LOGS",
      details: "Accessed system audit logs",
      metadata: { action, userId, limit, offset },
      
    });

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

// Get API key overview for admin
export const getApiKeyOverviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.adminUser;
    

    const apiKeys = await ApiKeyRepository.list();

    // Group API keys by user and add usage statistics
    const apiKeysByUser = new Map();

    for (const apiKey of apiKeys) {
      if (!apiKeysByUser.has(apiKey.userId)) {
        const user = await UserRepository.findById(apiKey.userId);
        apiKeysByUser.set(apiKey.userId, {
          user: {
            id: user?.id,
            email: user?.email,
            name: user?.name,
          },
          apiKeys: [],
        });
      }

      apiKeysByUser.get(apiKey.userId).apiKeys.push({
        id: apiKey.id,
        accessKeyId: apiKey.accessKeyId,
        name: apiKey.name,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt,
        revokedAt: apiKey.revokedAt,
      });
    }

    const overview = Array.from(apiKeysByUser.values());

    // Log admin access
    await AuditLogService.logAdminAction({
      adminId: admin.id,
      action: "VIEW_API_KEY_OVERVIEW",
      details: "Accessed API key overview dashboard",
      
    });

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "API key overview retrieved successfully",
        data: {
          overview,
          summary: {
            totalUsers: overview.length,
            totalApiKeys: apiKeys.length,
            activeKeys: apiKeys.filter((key: any) => key.isActive && !key.revokedAt).length,
            revokedKeys: apiKeys.filter((key: any) => key.revokedAt).length,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};
