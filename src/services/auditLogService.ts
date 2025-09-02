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
  API_KEY_UPGRADE_APPROVE: "API_KEY_UPGRADE_APPROVE",
  API_KEY_UPGRADE_REJECT: "API_KEY_UPGRADE_REJECT",

  // System events
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  STORAGE_UPLOAD: "STORAGE_UPLOAD",
  STORAGE_DELETE: "STORAGE_DELETE",

  // Admin events
  ADMIN_ACTION: "ADMIN_ACTION",
  SYSTEM_EVENT: "SYSTEM_EVENT",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

interface AuditLogData {
  action: AuditAction;
  apiAccessKeyId?: string;
  actorId?: string; // userId or adminId performing the action
  detail?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for handling audit logging throughout the application
 * Provides methods for logging various system events like user actions, API key management, admin actions, etc.
 * All audit logs are stored in the database and optionally logged to file system for backup
 */
export class AuditLogService {
  /**
   * Create an audit log entry for critical system events
   * This is the base logging method used by all other specialized logging methods
   * @param data - The audit log data containing action, actor, details, and metadata
   * @returns Promise that resolves when the audit log is successfully created
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
   * Log user authentication events (login success/failure)
   * @param action - The authentication action (USER_LOGIN or USER_LOGIN_FAILED)
   * @param data - Authentication event data including user info and failure reason if applicable
   * @returns Promise that resolves when the log is created
   */
  static async logUserAuth(
    action: "USER_LOGIN" | "USER_LOGIN_FAILED",
    data: {
      userId?: string;
      email: string;
      failureReason?: string;
    },
  ): Promise<void> {
    await this.log({
      action,
      actorId: data.userId,
      detail:
        action === "USER_LOGIN"
          ? `User ${data.email} logged in successfully`
          : `Failed login attempt for ${data.email}: ${data.failureReason}`,
      metadata: {
        email: data.email,
        failureReason: data.failureReason,
      },
    });
  }

  /**
   * Log user registration events
   * Records when new users successfully register for the platform
   * @param data - Registration event data including user ID and email
   * @returns Promise that resolves when the log is created
   */
  static async logUserRegister(data: {
    userId: string;
    email: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS.USER_REGISTER,
      actorId: data.userId,
      detail: `New user registered: ${data.email}`,
      metadata: {
        email: data.email,
      },
    });
  }

  /**
   * Log user profile updates
   * Records when user profiles are modified, including who made the changes
   * @param data - Update event data including target user, actor, and changes made
   * @returns Promise that resolves when the log is created
   */
  static async logUserUpdate(data: {
    userId: string;
    actorId: string; // who made the change (could be user themselves or admin)
    changes: Record<string, any>;
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
    });
  }

  /**
   * Log user account deletion
   */
  static async logUserDelete(data: {
    userId: string;
    actorId: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS.USER_DELETE,
      actorId: data.actorId,
      detail: `User account deleted: ${data.userId}`,
      metadata: {
        targetUserId: data.userId,
        selfDelete: data.userId === data.actorId,
      },
    });
  }

  /**
   * Log email verification events
   */
  static async logEmailVerified(data: {
    userId: string;
    email: string;
  }): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS.USER_EMAIL_VERIFIED,
      actorId: data.userId,
      detail: `Email verified for user: ${data.email}`,
      metadata: {
        email: data.email,
      },
    });
  }

  /**
   * Log API key management events (create, delete, revoke)
   * Records critical API key lifecycle events for security auditing
   * @param action - The type of API key action performed
   * @param data - API key event data including key info, user, and actor details
   * @returns Promise that resolves when the log is created
   */
  static async logApiKeyEvent(
    action: "API_KEY_CREATE" | "API_KEY_DELETE" | "API_KEY_REVOKE",
    data: {
      apiKeyId: string;
      apiAccessKeyId: string;
      userId: string;
      actorId: string;
      keyName?: string;
    },
  ): Promise<void> {
    await this.log({
      action: AUDIT_ACTIONS[action],
      apiAccessKeyId: data.apiAccessKeyId,
      actorId: data.actorId,
      detail: `API key ${action.toLowerCase().replace("_", " ")}: ${data.keyName || data.apiKeyId}`,
      metadata: {
        apiKeyId: data.apiKeyId,
        userId: data.userId,
        keyName: data.keyName,
      },
    });
  }

  /**
   * Log quota exceeded events
   * Records when users exceed their storage or object quotas
   * @param data - Quota event data including usage details and limits
   * @returns Promise that resolves when the log is created
   */
  static async logQuotaExceeded(data: {
    apiAccessKeyId: string;
    userId: string;
    quotaType: "storage" | "objects";
    currentUsage: number;
    limit: number;
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
    });
  }

  /**
   * Log administrative actions
   * Records when administrators perform privileged operations
   * @param data - Admin action data including admin ID, action type, target, and details
   * @returns Promise that resolves when the log is created
   */
  static async logAdminAction(data: {
    adminId: string;
    action: string;
    targetId?: string;
    details: string;
    metadata?: Record<string, any>;
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
    });
  }

  /**
   * Get audit logs with filtering options
   * Retrieves audit logs from the database with optional filtering
   * @param filters - Optional filters for action, API key, actor, date range, and limit
   * @returns Promise that resolves to filtered audit logs
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
