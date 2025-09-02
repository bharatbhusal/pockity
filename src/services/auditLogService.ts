import { AuditLogRepository } from "../repositories/auditLogRepository";
import { logger } from "../utils/logger";

// Audit log action types for critical events
export const AUDIT_ACTIONS = {
  // User management events
  USER_REGISTER: "USER_REGISTER",
  USER_LOGIN: "USER_LOGIN", 
  USER_LOGIN_FAILED: "USER_LOGIN_FAILED",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  USER_EMAIL_VERIFIED: "USER_EMAIL_VERIFIED",
  
  // API key management events
  API_KEY_CREATE: "API_KEY_CREATE",
  API_KEY_DELETE: "API_KEY_DELETE",
  API_KEY_REVOKE: "API_KEY_REVOKE",
  API_KEY_REQUEST_CREATE: "API_KEY_REQUEST_CREATE",
  API_KEY_REQUEST_APPROVE: "API_KEY_REQUEST_APPROVE",
  API_KEY_REQUEST_REJECT: "API_KEY_REQUEST_REJECT",
  API_KEY_UPGRADE_REQUEST: "API_KEY_UPGRADE_REQUEST",
  
  // System events
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  STORAGE_UPLOAD: "STORAGE_UPLOAD",
  STORAGE_DELETE: "STORAGE_DELETE",
  
  // Admin events
  ADMIN_ACTION: "ADMIN_ACTION",
  SYSTEM_EVENT: "SYSTEM_EVENT",
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

interface AuditLogData {
  action: AuditAction;
  apiAccessKeyId?: string;
  actorId?: string; // userId or adminId performing the action
  detail?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogService {
  /**
   * Create an audit log entry for critical system events
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      const auditLogEntry = {
        action: data.action,
        apiAccessKeyId: data.apiAccessKeyId,
        actorId: data.actorId,
        detail: data.detail,
        metadata: {
          ...data.metadata,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date().toISOString(),
        },
      };

      // Save to database
      await AuditLogRepository.create(auditLogEntry);

      // Also log to file system for backup
      logger.info({
        message: `AUDIT LOG: ${data.action}`,
        obj: auditLogEntry,
      });
    } catch (error) {
      // Critical: audit logging should never fail silently, but also shouldn't break the main flow
      logger.error({
        message: "Failed to create audit log entry",
        obj: { error, auditData: data },
      });
      
      // In production, you might want to send this to a monitoring service
      console.error("AUDIT LOG FAILURE:", error);
    }
  }

  /**
   * Log user authentication events
   */
  static async logUserAuth(action: "USER_LOGIN" | "USER_LOGIN_FAILED", data: {
    userId?: string;
    email: string;
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
  }): Promise<void> {
    await this.log({
      action,
      actorId: data.userId,
      detail: action === "USER_LOGIN" ? 
        `User ${data.email} logged in successfully` : 
        `Failed login attempt for ${data.email}: ${data.failureReason}`,
      metadata: {
        email: data.email,
        failureReason: data.failureReason,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Log user registration events
   */
  static async logUserRegister(data: {
    userId: string;
    email: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS.USER_REGISTER,
      actorId: data.userId,
      detail: `New user registered: ${data.email}`,
      metadata: {
        email: data.email,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Log user profile updates
   */
  static async logUserUpdate(data: {
    userId: string;
    actorId: string; // who made the change (could be user themselves or admin)
    changes: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS.USER_UPDATE,
      actorId: data.actorId,
      detail: `User profile updated for user ${data.userId}`,
      metadata: {
        targetUserId: data.userId,
        changes: data.changes,
        selfUpdate: data.userId === data.actorId,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Log user account deletion
   */
  static async logUserDelete(data: {
    userId: string;
    actorId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS.USER_DELETE,
      actorId: data.actorId,
      detail: `User account deleted: ${data.userId}`,
      metadata: {
        targetUserId: data.userId,
        selfDelete: data.userId === data.actorId,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Log email verification events
   */
  static async logEmailVerified(data: {
    userId: string;
    email: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS.USER_EMAIL_VERIFIED,
      actorId: data.userId,
      detail: `Email verified for user: ${data.email}`,
      metadata: {
        email: data.email,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Log API key management events
   */
  static async logApiKeyEvent(action: "API_KEY_CREATE" | "API_KEY_DELETE" | "API_KEY_REVOKE", data: {
    apiKeyId: string;
    apiAccessKeyId: string;
    userId: string;
    actorId: string;
    keyName?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS[action],
      apiAccessKeyId: data.apiAccessKeyId,
      actorId: data.actorId,
      detail: `API key ${action.toLowerCase().replace('_', ' ')}: ${data.keyName || data.apiKeyId}`,
      metadata: {
        apiKeyId: data.apiKeyId,
        userId: data.userId,
        keyName: data.keyName,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Log quota exceeded events
   */
  static async logQuotaExceeded(data: {
    apiAccessKeyId: string;
    userId: string;
    quotaType: "storage" | "objects";
    currentUsage: number;
    limit: number;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS.QUOTA_EXCEEDED,
      apiAccessKeyId: data.apiAccessKeyId,
      actorId: data.userId,
      detail: `Quota exceeded: ${data.quotaType} usage ${data.currentUsage} exceeds limit ${data.limit}`,
      metadata: {
        quotaType: data.quotaType,
        currentUsage: data.currentUsage,
        limit: data.limit,
      },
      ipAddress: data.ipAddress,
    });
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(data: {
    adminId: string;
    action: string;
    targetId?: string;
    details: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS.ADMIN_ACTION,
      actorId: data.adminId,
      detail: `Admin action: ${data.action} - ${data.details}`,
      metadata: {
        adminAction: data.action,
        targetId: data.targetId,
        ...data.metadata,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Get audit logs with filtering options
   */
  static async getAuditLogs(filters?: {
    action?: AuditAction;
    apiAccessKeyId?: string;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    // This will be implemented based on repository capabilities
    // For now, return basic logs
    return await AuditLogRepository.list();
  }
}