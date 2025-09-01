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
import { formatFileSize, getFileCategory } from "../utils/storageHelpher";
import path from "path";

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

const bulkDeleteSchema = z.object({
  fileNames: z.array(z.string().min(1, "File name is required")).min(1, "At least one file name required"),
});

// Upload file endpoint
export const uploadFileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiAccessKeyId = req.apiAccessKeyId!; // From API key middleware (if available)

    if (!req.file) {
      throw new PockityErrorInvalidInput({
        message: "No file provided",
        httpStatusCode: 400,
      });
    }

    const { originalname, buffer, mimetype } = req.file;
    // Check user's quota limits here
    const quotaCheck = await UsageService.checkQuotaLimits(apiAccessKeyId, buffer.length);
    if (!quotaCheck.canUpload) {
      throw new PockityErrorBadRequest({
        message: "Upload would exceed quota limits",
        httpStatusCode: 413,
        details: {
          quotaExceeded: quotaCheck.quotaExceeded,
          maxBytes: quotaCheck.maxBytes.toString(),
          maxObjects: quotaCheck.maxObjects,
          fileSize: buffer.length,
        },
      });
    }

    // Upload to S3 with appropriate prefix (API key or user-based)
    const result = await S3Service.uploadFile({
      fileName: originalname,
      fileBuffer: buffer,
      contentType: mimetype,
      apiAccessKeyId,
    });

    // Update user's usage statistics in the database
    await UsageService.incrementUsage(apiAccessKeyId, buffer.length, originalname);

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
    const apiAccessKeyId = req.apiAccessKeyId!; // From API key middleware (if available)
    const key = `${apiAccessKeyId}/${fileName}`;

    try {
      // Get file info first to check if it exists and get size
      const fileInfo = await S3Service.getFileInfo(key);

      // Delete from S3
      await S3Service.deleteFile(key);

      // Update user's usage statistics in the database
      await UsageService.decrementUsage(apiAccessKeyId, fileInfo.size, fileName);

      res.status(200).json(
        new PockityBaseResponse({
          success: true,
          message: "File deleted successfully",
          data: { key },
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
    const apiAccessKeyId = req.apiAccessKeyId!; // From API key middleware (if available)
    const key = `${apiAccessKeyId}/${fileName}`;

    try {
      // Get file info and generate presigned URL

      const fileInfo = await S3Service.getFileInfo(key);
      const url = await S3Service.getPermanentUrl(key);

      res.status(200).json(
        new PockityBaseResponse({
          success: true,
          message: "File URL generated successfully",
          data: {
            key,
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
    const apiAccessKeyId = req.apiAccessKeyId!; // From API key middleware (if available)

    // Get all files for the user or API key
    const files = await S3Service.listUserFiles(apiAccessKeyId);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Files retrieved successfully",
        data: {
          files,
          totalFiles: files.length,
          totalSizeGB:
            Math.round((files.reduce((sum, file) => sum + file.sizeInBytes, 0) / (1024 * 1024 * 1024)) * 10000) / 10000,
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
    const apiAccessKeyId = req.apiAccessKeyId!; // From API key middleware (if available)

    // Get storage usage with quota information
    const usageData = await UsageService.getUsageWithQuota(apiAccessKeyId);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Storage usage retrieved successfully",
        data: {
          totalBytes: usageData.usage.bytesUsed.toString(),
          totalSizeGB: Math.round((Number(usageData.usage.bytesUsed) / (1024 * 1024 * 1024)) * 10000) / 10000,
          objectCount: usageData.usage.objects,
          lastUpdated: usageData.usage.lastUpdated,
          quota: {
            maxBytes: usageData.quota.maxBytes.toString(),
            maxSizeGB: Math.round((Number(usageData.quota.maxBytes) / (1024 * 1024 * 1024)) * 10000) / 10000,
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

// Get detailed file metadata
export const getFileMetadataController = async (req: Request, res: Response, next: NextFunction) => {
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
    const apiAccessKeyId = req.apiAccessKeyId!; // From API key middleware (if available)
    const key = `${apiAccessKeyId}/${fileName}`;

    try {
      // Get detailed file metadata
      const fileInfo = await S3Service.getFileInfo(key);
      const presignedUrl = await S3Service.getSignedUrl(key);

      res.status(200).json(
        new PockityBaseResponse({
          success: true,
          message: "File metadata retrieved successfully",
          data: {
            fileName: fileName,
            fileKey: key,
            size: fileInfo.size,
            sizeFormatted: formatFileSize(fileInfo.size),
            lastModified: fileInfo.lastModified,
            contentType: fileInfo.contentType,
            downloadUrl: presignedUrl,
            sharingEnabled: true, // For future sharing features
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

// Bulk delete files
export const bulkDeleteFilesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = bulkDeleteSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid file names",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { fileNames } = validationResult.data;

    const apiAccessKeyId = req.apiAccessKeyId!; // From API key middleware (if available)

    const results = [];
    let totalSizeDeleted = 0;
    let key = "";
    for (const fileName of fileNames) {
      try {
        key = `${apiAccessKeyId}/${fileName}`;
        // Get file info first
        const fileInfo = await S3Service.getFileInfo(key);

        // Delete from S3
        await S3Service.deleteFile(key);

        // Update usage statistics
        await UsageService.decrementUsage(apiAccessKeyId, fileInfo.size, key);

        totalSizeDeleted += fileInfo.size;

        results.push({
          fileName,
          success: true,
          size: fileInfo.size,
        });
      } catch (error: any) {
        results.push({
          fileName,
          success: false,
          error: error.message || "Failed to delete file",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: `Bulk delete completed: ${successCount} succeeded, ${failCount} failed`,
        data: {
          results,
          summary: {
            totalFiles: fileNames.length,
            successCount,
            failCount,
            totalSizeDeleted,
            totalSizeDeletedFormatted: formatFileSize(totalSizeDeleted),
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get storage analytics
export const getStorageAnalyticsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiAccessKeyId = req.apiAccessKeyId!; // From API key middleware (if available)

    // Get all files to analyze
    const files = await S3Service.listUserFiles(apiAccessKeyId);
    const usageData = await UsageService.getUsageWithQuota(apiAccessKeyId);

    // Analyze file types
    const fileTypeAnalysis: Record<string, { count: number; totalSize: number }> = {};
    let totalSize = 0;

    for (const file of files) {
      const category = file.contentType?.split("/")[0] || "Unknown";

      if (!fileTypeAnalysis[category]) {
        fileTypeAnalysis[category] = { count: 0, totalSize: 0 };
      }

      fileTypeAnalysis[category].count++;
      fileTypeAnalysis[category].totalSize += file.sizeInBytes;
      totalSize += file.sizeInBytes;
    }

    // Calculate percentages
    const fileTypeBreakdown = Object.entries(fileTypeAnalysis).map(([category, data]) => ({
      category,
      count: data.count,
      totalSize: data.totalSize,
      totalSizeFormatted: formatFileSize(data.totalSize),
      percentage: totalSize > 0 ? Math.round((data.totalSize / totalSize) * 100) : 0,
    }));

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Storage analytics retrieved successfully",
        data: {
          summary: {
            totalFiles: files.length,
            totalSize,
            totalSizeFormatted: formatFileSize(totalSize),
            quotaUsagePercentage: usageData.usagePercentage,
          },
          fileTypeBreakdown,
          recentFiles: files
            .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
            .slice(0, 10)
            .map((file) => ({
              key: file.key,
              size: file.sizeInBytes,
              sizeFormatted: formatFileSize(file.sizeInBytes),
              lastModified: file.lastModified,
              category: file.contentType?.split("/")[0] || "Unknown",
            })),
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};
