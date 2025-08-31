import { UsageCurrentRepository } from "../repositories/usageCurrentRepository";
import { AuditLogRepository } from "../repositories/auditLogRepository";

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
  async getCurrentUsage(userId: string): Promise<UsageStats> {
    let usage = await UsageCurrentRepository.findByUserId(userId);

    if (!usage) {
      // Initialize usage if not exists
      usage = await UsageCurrentRepository.create({
        userId,
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
  async checkQuotaLimits(userId: string, fileSizeBytes: number): Promise<QuotaLimits> {
    // Get current usage
    const currentUsage = await this.getCurrentUsage(userId);

    // Default to a basic free tier if no subscription
    let maxBytes = BigInt(1024 * 1024 * 1024); // 1GB default
    let maxObjects = 1000; // 1000 objects default

    const newBytesUsed = currentUsage.bytesUsed + BigInt(fileSizeBytes);
    const newObjectCount = currentUsage.objects + 1;

    const bytesExceeded = newBytesUsed > maxBytes;
    const objectsExceeded = newObjectCount > maxObjects;
    const quotaExceeded = bytesExceeded || objectsExceeded;

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
  async incrementUsage(userId: string, fileSizeBytes: number, fileName: string): Promise<void> {
    await UsageCurrentRepository.upsertByUserId(userId, {
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
      userId,
      action: "STORAGE_UPLOAD",
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
  async decrementUsage(userId: string, fileSizeBytes: number, fileName: string): Promise<void> {
    const currentUsage = await this.getCurrentUsage(userId);

    // Ensure we don't go below zero
    const newBytesUsed = currentUsage.bytesUsed - BigInt(fileSizeBytes);
    const newObjectCount = Math.max(0, currentUsage.objects - 1);

    await UsageCurrentRepository.updateByUserId(userId, {
      bytesUsed: newBytesUsed >= 0 ? newBytesUsed : BigInt(0),
      objects: newObjectCount,
      lastUpdated: new Date(),
    });

    // Log the action
    await AuditLogRepository.create({
      userId,
      action: "STORAGE_DELETE",
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
  async getUsageWithQuota(userId: string): Promise<{
    usage: UsageStats;
    quota: QuotaLimits;
    usagePercentage: {
      bytes: number;
      objects: number;
    };
  }> {
    const usage = await this.getCurrentUsage(userId);
    const quota = await this.checkQuotaLimits(userId, 0); // Check without adding any file

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
