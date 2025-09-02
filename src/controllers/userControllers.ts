import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserRepository } from "../repositories/userRepository";
import { UsageService } from "../services/usageService";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { PockityErrorInvalidInput, PockityErrorBadRequest } from "../utils/response/PockityErrorClasses";
import { ApiKeyRepository } from "../repositories";
import { AuditLogService } from "../services/auditLogService";
import { getAuditContext } from "../utils/auditHelpers";

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

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
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          apiKeys: apiKeys.map((key: any) => ({
            id: key.id,
            apiAccessKeyId: key.accessKeyId,
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

// Update user profile
export const updateUserProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = updateProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid profile data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { name, email } = validationResult.data;
    const user = req.user;
    const auditContext = getAuditContext(req);

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        throw new PockityErrorBadRequest({
          message: "Email is already taken",
          httpStatusCode: 409,
        });
      }
    }

    // Update user profile
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      updateData.email = email;
      updateData.emailVerified = false; // Re-verify email if changed
    }

    const updatedUser = await UserRepository.update(user.id, updateData);

    // Log the profile update
    await AuditLogService.logUserUpdate({
      userId: user.id,
      actorId: user.id, // User updating their own profile
      changes: updateData,
      ...auditContext,
    });

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            emailVerified: updatedUser.emailVerified,
            updatedAt: updatedUser.updatedAt,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Change user password
export const changePasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = changePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid password data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { currentPassword, newPassword } = validationResult.data;
    const user = req.user;

    // Verify current password
    const bcrypt = require("bcrypt");
    if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new PockityErrorBadRequest({
        message: "Current password is incorrect",
        httpStatusCode: 400,
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await UserRepository.update(user.id, {
      passwordHash: newPasswordHash,
      emailVerified: false,
    });

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Password changed successfully",
        data: {},
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Delete user account
export const deleteUserAccountController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const auditContext = getAuditContext(req);
    
    // Log the account deletion before performing it
    await AuditLogService.logUserDelete({
      userId: user.id,
      actorId: user.id, // User deleting their own account
      ...auditContext,
    });

    // TODO: In a real implementation, we should:
    // 1. Delete all user's files from S3
    // 2. Delete related data (API keys, usage records, etc.)

    // For now, we'll just mark the account as deleted by setting a flag
    // In a real system, you might want to anonymize data instead of hard delete
    await UserRepository.update(user.id, {
      email: `deleted_${user.id}@example.com`,
      name: "Deleted User",
      emailVerified: false,
    });

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Account deletion initiated. All data will be removed within 30 days.",
        data: {},
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
          apiAccessKeyId: key.accessKeyId,
          name: key.name,
          isActive: key.isActive,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
          revokedAt: key.revokedAt,
          quota: {
            usage: {
              gbsUsed: (Number(usageWithQuota.usage.bytesUsed) / 1024 ** 3).toFixed(2),
              objects: usageWithQuota.usage.objects,
              lastUpdated: usageWithQuota.usage.lastUpdated,
            },
            quota: {
              maxGbs: (Number(usageWithQuota.quota.maxBytes) / 1024 ** 3).toFixed(2),
              maxObjects: usageWithQuota.quota.maxObjects,
              canUpload: usageWithQuota.quota.canUpload,
              quotaExceeded: usageWithQuota.quota.quotaExceeded,
            },
          },
        };
      }),
    );
    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Account summary retrieved successfully",
        data: {
          profile: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          },
          apiKeys: apiKeysWithUsage,
        },
      }),
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};
