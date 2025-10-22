import { AuditLogRepository } from "../repositories/auditLogRepository";
import { logger } from "../utils/logger";

export enum API_REQUEST_TYPE {
  CREATE = "CREATE",
  UPGRADE = "UPGRADE",
}

export enum API_REQUEST_STATUS {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum AuditAction {
  USER_ONBOARD = "USER_ONBOARD",

  API_KEY_REQUEST_CREATE = "API_KEY_REQUEST_CREATE",
  API_KEY_REQUEST_APPROVE = "API_KEY_REQUEST_APPROVE",
  API_KEY_REQUEST_REJECT = "API_KEY_REQUEST_REJECT",

  API_KEY_REVOKE = "API_KEY_REVOKE",

  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  STORAGE_UPLOAD = "STORAGE_UPLOAD",
  STORAGE_DELETE = "STORAGE_DELETE",

  ADMIN_ACTION = "ADMIN_ACTION",
  SYSTEM_EVENT = "SYSTEM_EVENT",
  VIEW_SYSTEM_HEALTH = "VIEW_SYSTEM_HEALTH",
}

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
    }
  }

  /**
   * Log user authentication events (login success/failure)
   * @param action - The authentication action (USER_LOGIN or USER_LOGIN_FAILED)
   * @param data - Authentication event data including user info and failure reason if applicable
   * @returns Promise that resolves when the log is created
   */
  static async logUserAuth(
    action: AuditAction.USER_ONBOARD,
    data: {
      userId?: string;
      email: string;
      failureReason?: string;
    },
  ): Promise<void> {
    await this.log({
      action,
      actorId: data.userId,
      detail: `Authentication event for ${data.email}`,
      metadata: {
        email: data.email,
        failureReason: data.failureReason,
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
    action:
      | AuditAction.API_KEY_REQUEST_CREATE
      | AuditAction.API_KEY_REQUEST_APPROVE
      | AuditAction.API_KEY_REQUEST_REJECT
      | AuditAction.API_KEY_REVOKE,
    data: {
      apiAccessKeyId?: string;
      userId: string;
      actorId: string;
      keyName?: string;
      requestType?: API_REQUEST_TYPE;
    },
  ): Promise<void> {
    await this.log({
      action,
      apiAccessKeyId: data.apiAccessKeyId,
      actorId: data.actorId,
      detail: `API key ${action.toLowerCase().replace("_", " ")}: ${data.keyName || data.apiAccessKeyId}`,
      metadata: {
        userId: data.userId,
        keyName: data.keyName || undefined,
        requestType: data.requestType || undefined,
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
      action: AuditAction.QUOTA_EXCEEDED,
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
      action: AuditAction.ADMIN_ACTION,
      actorId: data.adminId,
      detail: `Admin action: ${data.action} - ${data.details}`,
      metadata: {
        adminAction: data.action,
        targetId: data.targetId,
        ...data.metadata,
      },
    });
  }
}
