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

const updateFileMetadataSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const bulkDeleteSchema = z.object({
  fileNames: z.array(z.string().min(1, "File name is required")).min(1, "At least one file name required"),
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
      // Get detailed file metadata
      const fileInfo = await S3Service.getFileInfo(userId, fileName);
      const presignedUrl = await S3Service.getSignedUrl(`users/${userId}/${fileName}`);

      res.status(200).json(
        new PockityBaseResponse({
          success: true,
          message: "File metadata retrieved successfully",
          data: {
            fileName,
            key: `users/${userId}/${fileName}`,
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
    const userId = req.userId!; // From JWT middleware

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const results = [];
    let totalSizeDeleted = 0;

    for (const fileName of fileNames) {
      try {
        // Get file info first
        const fileInfo = await S3Service.getFileInfo(userId, fileName);
        
        // Delete from S3
        await S3Service.deleteFile(userId, fileName);
        
        // Update usage statistics
        await UsageService.decrementUsage(userId, fileInfo.size, fileName);
        
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

    const successCount = results.filter(r => r.success).length;
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
    const userId = req.userId!; // From JWT middleware

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    // Get all files to analyze
    const files = await S3Service.listUserFiles(userId);
    const usageData = await UsageService.getUsageWithQuota(userId);

    // Analyze file types
    const fileTypeAnalysis: Record<string, { count: number; totalSize: number }> = {};
    let totalSize = 0;

    for (const file of files) {
      const extension = file.key.split('.').pop()?.toLowerCase() || 'unknown';
      const category = getFileCategory(extension);
      
      if (!fileTypeAnalysis[category]) {
        fileTypeAnalysis[category] = { count: 0, totalSize: 0 };
      }
      
      fileTypeAnalysis[category].count++;
      fileTypeAnalysis[category].totalSize += file.size;
      totalSize += file.size;
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
            .map(file => ({
              fileName: file.key,
              size: file.size,
              sizeFormatted: formatFileSize(file.size),
              lastModified: file.lastModified,
              category: getFileCategory(file.key.split('.').pop()?.toLowerCase() || 'unknown'),
            })),
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileCategory(extension: string): string {
  const categories: Record<string, string> = {
    // Images
    'jpg': 'Images', 'jpeg': 'Images', 'png': 'Images', 'gif': 'Images', 'bmp': 'Images', 
    'svg': 'Images', 'webp': 'Images', 'tiff': 'Images', 'ico': 'Images',
    
    // Videos
    'mp4': 'Videos', 'avi': 'Videos', 'mov': 'Videos', 'wmv': 'Videos', 'flv': 'Videos',
    'webm': 'Videos', 'mkv': 'Videos', '3gp': 'Videos',
    
    // Audio
    'mp3': 'Audio', 'wav': 'Audio', 'flac': 'Audio', 'aac': 'Audio', 'ogg': 'Audio',
    'wma': 'Audio', 'm4a': 'Audio',
    
    // Documents
    'pdf': 'Documents', 'doc': 'Documents', 'docx': 'Documents', 'xls': 'Documents',
    'xlsx': 'Documents', 'ppt': 'Documents', 'pptx': 'Documents', 'txt': 'Documents',
    'rtf': 'Documents', 'odt': 'Documents',
    
    // Archives
    'zip': 'Archives', 'rar': 'Archives', '7z': 'Archives', 'tar': 'Archives',
    'gz': 'Archives', 'bz2': 'Archives',
    
    // Code
    'js': 'Code', 'ts': 'Code', 'html': 'Code', 'css': 'Code', 'py': 'Code',
    'java': 'Code', 'cpp': 'Code', 'c': 'Code', 'php': 'Code', 'rb': 'Code',
  };
  
  return categories[extension] || 'Other';
}
