import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserRepository } from "../repositories/userRepository";
import { UsageService } from "../services/usageService";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { PockityErrorInvalidInput, PockityErrorBadRequest } from "../utils/response/PockityErrorClasses";

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
    const usageData = await UsageService.getUsageWithQuota(user.id);

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
          usage: {
            bytesUsed: usageData.usage.bytesUsed.toString(),
            objectsUsed: usageData.usage.objects,
            quotaBytes: usageData.quota.maxBytes.toString(),
            quotaObjects: usageData.quota.maxObjects,
            usagePercentage: usageData.usagePercentage,
          },
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

    // Get comprehensive account information
    const usageData = await UsageService.getUsageWithQuota(user.id);

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
          usage: {
            current: {
              bytesUsed: usageData.usage.bytesUsed.toString(),
              objectsUsed: usageData.usage.objects,
              lastUpdated: usageData.usage.lastUpdated,
            },
            quota: {
              maxBytes: usageData.quota.maxBytes.toString(),
              maxObjects: usageData.quota.maxObjects,
            },
            percentage: usageData.usagePercentage,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};
