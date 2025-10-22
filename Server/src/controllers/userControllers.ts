import { Request, Response, NextFunction } from "express";
import { UsageService } from "../services/usageService";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { ApiKeyRepository } from "../repositories";

// Get user profile
export const getUserProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    // Get usage and billing information
    const apiKeys = await ApiKeyRepository.findByUserId(user.id);
    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "User profile retrieved successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            picture: user.picture,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          apiKeys: apiKeys.map((key: any) => ({
            id: key.id,
            accessKeyId: key.accessKeyId,
            secretHash: key.secretHash,
            name: key.name,
            isActive: key.isActive,
            createdAt: key.createdAt,
            lastUsedAt: key.lastUsedAt,
            revokedAt: key.revokedAt,
          })),
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get account summary with all important information
export const getAccountSummaryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    const apiKeys = await ApiKeyRepository.findByUserId(user.id);
    const apiKeysWithUsage = await Promise.all(
      apiKeys.map(async (key: any) => {
        const usageWithQuota = await UsageService.getUsageWithQuota(key.accessKeyId);
        return {
          id: key.id,
          accessKeyId: key.accessKeyId,
          name: key.name,
          isActive: key.isActive,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
          revokedAt: key.revokedAt,
          stats: {
            bytesUsed: Number(usageWithQuota.usage.bytesUsed),
            objects: usageWithQuota.usage.objects,
            storageLimitBytes: Number(usageWithQuota.quota.maxBytes),
            objectLimit: usageWithQuota.quota.maxObjects,
            lastUpdated: usageWithQuota.usage.lastUpdated,
            usagePercentage: usageWithQuota.usagePercentage,
          },
        };
      }),
    );
    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Account summary retrieved successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
          apiKeysWithStats: apiKeysWithUsage,
        },
      }),
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};
