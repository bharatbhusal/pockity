import { UsageCurrentRepository } from "../repositories/usageCurrentRepository";
import { AuditLogRepository } from "../repositories/auditLogRepository";
import { AuditAction, AuditLogService } from "./auditLogService";
import { ApiKeyRepository } from "../repositories/apiKeyRepository";

export interface UsageStats {
  bytesUsed: bigint;
  objects: number;
  lastUpdated: Date;
}

export interface QuotaLimits {
  maxBytes: bigint;
  maxObjects: number;
  canUpload: boolean;
  quotaExceeded: boolean;
}

export const UsageService = {
  /**
   * Get current usage for a user
   */
  async getCurrentUsage(apiAccessKeyId: string): Promise<UsageStats> {
    let usage = await UsageCurrentRepository.findByApiAccessKeyId(apiAccessKeyId);

    if (!usage) {
      // Initialize usage if not exists
      usage = await UsageCurrentRepository.create({
        apiAccessKeyId,
        bytesUsed: BigInt(0),
        objects: 0,
        lastUpdated: new Date(),
      });
    }

    return {
      bytesUsed: usage.bytesUsed,
      objects: usage.objects,
      lastUpdated: usage.lastUpdated,
    };
  },

  /**
   * Check if user can upload a file based on quota limits
   */
  async checkQuotaLimits(apiAccessKeyId: string, fileSizeBytes: number): Promise<QuotaLimits> {
    // Get current usage
    const currentUsage = await this.getCurrentUsage(apiAccessKeyId);
    const apiKey = await ApiKeyRepository.findByAccessKeyId(apiAccessKeyId);

    // Default to a basic free tier if no subscription
    let maxBytes = apiKey?.totalStorage || BigInt(1024 * 1024 * 1024); // 1GB default
    let maxObjects = apiKey?.totalObjects || 1000; // 1000 objects default

    const newBytesUsed = currentUsage.bytesUsed + BigInt(fileSizeBytes);
    const newObjectCount = currentUsage.objects + 1;

    const bytesExceeded = newBytesUsed > maxBytes;
    const objectsExceeded = newObjectCount > maxObjects;
    const quotaExceeded = bytesExceeded || objectsExceeded;

    // Log quota exceeded events
    if (quotaExceeded) {
      try {
        // Get the API key to find the user
        const apiKey = await ApiKeyRepository.findByAccessKeyId(apiAccessKeyId);
        if (apiKey) {
          if (bytesExceeded) {
            await AuditLogService.logQuotaExceeded({
              apiAccessKeyId,
              userId: apiKey.userId,
              quotaType: "storage",
              currentUsage: Number(newBytesUsed),
              limit: Number(maxBytes),
            });
          }
          if (objectsExceeded) {
            await AuditLogService.logQuotaExceeded({
              apiAccessKeyId,
              userId: apiKey.userId,
              quotaType: "objects",
              currentUsage: newObjectCount,
              limit: maxObjects,
            });
          }
        }
      } catch (error) {
        // Don't fail the quota check if audit logging fails
        console.error("Failed to log quota exceeded event:", error);
      }
    }

    return {
      maxBytes,
      maxObjects,
      canUpload: !quotaExceeded,
      quotaExceeded,
    };
  },

  /**
   * Update usage when a file is uploaded
   */
  async incrementUsage(apiAccessKeyId: string, fileSizeBytes: number, fileName: string): Promise<void> {
    await UsageCurrentRepository.upsertByApiAccessKeyId(apiAccessKeyId, {
      bytesUsed: {
        increment: BigInt(fileSizeBytes),
      },
      objects: {
        increment: 1,
      },
      lastUpdated: new Date(),
    });

    // Log the action
    await AuditLogRepository.create({
      apiAccessKeyId,
      action: AuditAction.STORAGE_UPLOAD,
      detail: `Uploaded file: ${fileName}`,
      metadata: {
        fileName,
        fileSizeBytes,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Update usage when a file is deleted
   */
  async decrementUsage(apiAccessKeyId: string, fileSizeBytes: number, fileName: string): Promise<void> {
    const currentUsage = await this.getCurrentUsage(apiAccessKeyId);

    // Ensure we don't go below zero
    const newBytesUsed = currentUsage.bytesUsed - BigInt(fileSizeBytes);
    const newObjectCount = Math.max(0, currentUsage.objects - 1);

    await UsageCurrentRepository.updateByApiAccessKeyId(apiAccessKeyId, {
      bytesUsed: newBytesUsed >= 0 ? newBytesUsed : BigInt(0),
      objects: newObjectCount,
      lastUpdated: new Date(),
    });

    // Log the action
    await AuditLogRepository.create({
      apiAccessKeyId,
      action: AuditAction.STORAGE_DELETE,
      detail: `Deleted file: ${fileName}`,
      metadata: {
        fileName,
        fileSizeBytes,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Get usage statistics with quota information
   */
  async getUsageWithQuota(apiAccessKeyId: string): Promise<{
    usage: UsageStats;
    quota: QuotaLimits;
    usagePercentage: {
      bytes: number;
      objects: number;
    };
  }> {
    const usage = await this.getCurrentUsage(apiAccessKeyId);
    const quota = await this.checkQuotaLimits(apiAccessKeyId, 0); // Check without adding any file

    const bytesPercentage = (Number(usage.bytesUsed) / Number(quota.maxBytes)) * 100;
    const objectsPercentage = (usage.objects / quota.maxObjects) * 100;

    return {
      usage,
      quota,
      usagePercentage: {
        bytes: Math.min(100, Math.max(0, bytesPercentage)),
        objects: Math.min(100, Math.max(0, objectsPercentage)),
      },
    };
  },
};
