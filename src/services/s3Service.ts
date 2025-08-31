import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export interface UploadFileParams {
  userId: string;
  fileName: string;
  fileBuffer: Buffer;
  contentType?: string;
  accessKeyId?: string; // For API key-based uploads
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
  url?: string;
}

export const S3Service = {
  /**
   * Get the appropriate S3 prefix based on whether we have an accessKeyId
   */
  getStoragePrefix(userId: string, accessKeyId?: string): string {
    if (accessKeyId) {
      return `apikeys/${accessKeyId}/`;
    }
    return `users/${userId}/`;
  },

  /**
   * Upload a file to S3 with user-specific or API key-specific prefix
   */
  async uploadFile(params: UploadFileParams): Promise<{ key: string; url: string }> {
    const { userId, fileName, fileBuffer, contentType, accessKeyId } = params;

    if (!env.S3_BUCKET) {
      throw new Error("S3_BUCKET environment variable is not configured");
    }

    // Create appropriate prefix to isolate storage
    const prefix = this.getStoragePrefix(userId, accessKeyId);
    const key = `${prefix}${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || "application/octet-stream",
    });

    await s3Client.send(command);

    // Generate a presigned URL for access
    const url = await this.getSignedUrl(key);

    return { key, url };
  },

  /**
   * Delete a file from S3
   */
  async deleteFile(userId: string, fileName: string, accessKeyId?: string): Promise<void> {
    if (!env.S3_BUCKET) {
      throw new Error("S3_BUCKET environment variable is not configured");
    }

    const prefix = this.getStoragePrefix(userId, accessKeyId);
    const key = `${prefix}${fileName}`;

    const command = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
  },

  /**
   * Get a presigned URL for a file
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!env.S3_BUCKET) {
      throw new Error("S3_BUCKET environment variable is not configured");
    }

    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  },

  /**
   * List all files for a user or API key
   */
  async listUserFiles(userId: string, accessKeyId?: string): Promise<S3Object[]> {
    if (!env.S3_BUCKET) {
      throw new Error("S3_BUCKET environment variable is not configured");
    }

    const prefix = this.getStoragePrefix(userId, accessKeyId);

    const command = new ListObjectsV2Command({
      Bucket: env.S3_BUCKET,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return [];
    }

    const objects: S3Object[] = [];

    for (const object of response.Contents) {
      if (object.Key && object.Size !== undefined && object.LastModified) {
        // Generate presigned URL for each file
        const url = await this.getSignedUrl(object.Key);

        objects.push({
          key: object.Key.replace(prefix, ""), // Remove prefix to show just filename
          size: object.Size,
          lastModified: object.LastModified,
          url,
        });
      }
    }

    return objects;
  },

  /**
   * Get file metadata
   */
  async getFileInfo(
    userId: string,
    fileName: string,
    accessKeyId?: string,
  ): Promise<{ size: number; lastModified: Date; contentType?: string }> {
    if (!env.S3_BUCKET) {
      throw new Error("S3_BUCKET environment variable is not configured");
    }

    const prefix = this.getStoragePrefix(userId, accessKeyId);
    const key = `${prefix}${fileName}`;

    const command = new HeadObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);

    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType,
    };
  },

  /**
   * Calculate total storage used by a user or API key
   */
  async getUserStorageUsage(userId: string, accessKeyId?: string): Promise<{ totalBytes: number; objectCount: number }> {
    const files = await this.listUserFiles(userId, accessKeyId);

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const objectCount = files.length;

    return { totalBytes, objectCount };
  },

  /**
   * Validate if file belongs to user or API key (security check)
   */
  validateUserAccess(userId: string, fileKey: string, accessKeyId?: string): boolean {
    if (accessKeyId) {
      return fileKey.startsWith(`apikeys/${accessKeyId}/`);
    }
    return fileKey.startsWith(`users/${userId}/`);
  },

  /**
   * Create an API key folder in S3 bucket
   */
  async createApiKeyFolder(accessKeyId: string): Promise<void> {
    if (!env.S3_BUCKET) {
      throw new Error("S3_BUCKET environment variable is not configured");
    }

    // Create a placeholder object to ensure the "folder" exists
    // S3 doesn't have real folders, but this ensures the prefix is available
    const key = `apikeys/${accessKeyId}/.pockity-apikey`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: Buffer.from(`API Key folder created for ${accessKeyId}`),
      ContentType: "text/plain",
    });

    await s3Client.send(command);
  },
};
