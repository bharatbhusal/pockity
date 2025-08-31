import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import multer from "multer";
import { S3Service } from "../services/s3Service";
import { UsageService } from "../services/usageService";
import { UserRepository } from "../repositories/userRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import {
  PockityErrorInvalidInput,
  PockityErrorNotFound,
  PockityErrorBadRequest,
} from "../utils/response/PockityErrorClasses";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Validation schemas
const deleteFileSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
});

const getFileSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
});

// Upload file endpoint
export const uploadFileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    if (!req.file) {
      throw new PockityErrorInvalidInput({
        message: "No file provided",
        httpStatusCode: 400,
      });
    }

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const { originalname, buffer, mimetype } = req.file;

    // Check user's quota limits here
    const quotaCheck = await UsageService.checkQuotaLimits(userId, buffer.length);
    if (!quotaCheck.canUpload) {
      throw new PockityErrorBadRequest({
        message: "Upload would exceed quota limits",
        httpStatusCode: 413,
        details: {
          quotaExceeded: quotaCheck.quotaExceeded,
          maxBytes: quotaCheck.maxBytes.toString(),
          maxObjects: quotaCheck.maxObjects,
        },
      });
    }

    // Upload to S3
    const result = await S3Service.uploadFile({
      userId,
      fileName: originalname,
      fileBuffer: buffer,
      contentType: mimetype,
    });

    // Update user's usage statistics in the database
    await UsageService.incrementUsage(userId, buffer.length, originalname);

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "File uploaded successfully",
        data: {
          fileName: originalname,
          key: result.key,
          url: result.url,
          size: buffer.length,
          contentType: mimetype,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Delete file endpoint
export const deleteFileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request params
    const validationResult = deleteFileSchema.safeParse(req.params);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid file name",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { fileName } = validationResult.data;
    const userId = req.userId!; // From JWT middleware

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    try {
      // Get file info first to check if it exists and get size
      const fileInfo = await S3Service.getFileInfo(userId, fileName);

      // Delete from S3
      await S3Service.deleteFile(userId, fileName);

      // Update user's usage statistics in the database
      await UsageService.decrementUsage(userId, fileInfo.size, fileName);

      res.status(200).json(
        new PockityBaseResponse({
          success: true,
          message: "File deleted successfully",
          data: {
            fileName,
          },
        }),
      );
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        throw new PockityErrorNotFound({
          message: "File not found",
          httpStatusCode: 404,
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Get file endpoint (returns presigned URL)
export const getFileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request params
    const validationResult = getFileSchema.safeParse(req.params);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid file name",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { fileName } = validationResult.data;
    const userId = req.userId!; // From JWT middleware

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    try {
      // Get file info and generate presigned URL
      const fileInfo = await S3Service.getFileInfo(userId, fileName);
      const url = await S3Service.getSignedUrl(`users/${userId}/${fileName}`);

      res.status(200).json(
        new PockityBaseResponse({
          success: true,
          message: "File URL generated successfully",
          data: {
            fileName,
            url,
            size: fileInfo.size,
            lastModified: fileInfo.lastModified,
            contentType: fileInfo.contentType,
          },
        }),
      );
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        throw new PockityErrorNotFound({
          message: "File not found",
          httpStatusCode: 404,
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// List all files for the user
export const listFilesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    // Get all files for the user
    const files = await S3Service.listUserFiles(userId);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Files retrieved successfully",
        data: {
          files,
          totalFiles: files.length,
          totalSize: files.reduce((sum, file) => sum + file.size, 0),
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get user's storage usage
export const getStorageUsageController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    // Get storage usage with quota information
    const usageData = await UsageService.getUsageWithQuota(userId);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Storage usage retrieved successfully",
        data: {
          totalBytes: usageData.usage.bytesUsed.toString(),
          totalSizeGB: Math.round((Number(usageData.usage.bytesUsed) / (1024 * 1024 * 1024)) * 100) / 100,
          objectCount: usageData.usage.objects,
          lastUpdated: usageData.usage.lastUpdated,
          quota: {
            maxBytes: usageData.quota.maxBytes.toString(),
            maxSizeGB: Math.round((Number(usageData.quota.maxBytes) / (1024 * 1024 * 1024)) * 100) / 100,
            maxObjects: usageData.quota.maxObjects,
          },
          usagePercentage: usageData.usagePercentage,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Middleware for handling file uploads
export const uploadMiddleware = upload.single("file");
