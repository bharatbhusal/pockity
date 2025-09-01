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
  fileName: string;
  fileBuffer: Buffer;
  contentType?: string;
  apiAccessKeyId: string;
}

export interface S3Object {
  key: string;
  sizeInBytes: number;
  lastModified: Date;
  url?: string;
  contentType?: string;
}

export const S3Service = {
  /**
   * Upload a file to S3 with user-specific or API key-specific prefix
   */
  async uploadFile(params: UploadFileParams): Promise<{ key: string; url: string }> {
    const { fileName, fileBuffer, contentType, apiAccessKeyId } = params;

    // Create appropriate prefix to isolate storage
    const key = `${apiAccessKeyId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || "application/octet-stream",
    });

    await s3Client.send(command);

    // Generate a presigned URL for access
    // const url = await this.getSignedUrl(key);
    const url = await this.getPermanentUrl(key);

    return { key, url };
  },

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
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
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  },

  /**
   * Get a permanent URL for a file
   */
  async getPermanentUrl(key: string): Promise<string> {
    return `https://${env.S3_BUCKET}.s3.amazonaws.com/${key}`;
  },

  /**
   * List all files for a user or API key
   */
  async listUserFiles(apiAccessKeyId: string): Promise<S3Object[]> {
    const command = new ListObjectsV2Command({
      Bucket: env.S3_BUCKET,
      Prefix: `${apiAccessKeyId}/`,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return [];
    }

    // Use Promise.all to fetch file info and URLs in parallel
    const objects: S3Object[] = await Promise.all(
      response.Contents.filter((object) => object.Key && object.Size !== undefined && object.LastModified).map(
        async (object) => {
          // Generate presigned URL for each file
          const url = await this.getPermanentUrl(object.Key!);

          const { contentType } = await S3Service.getFileInfo(object.Key!);

          return {
            key: object.Key!,
            sizeInBytes: object.Size!,
            lastModified: object.LastModified!,
            url,
            contentType,
          };
        },
      ),
    );

    return objects;
  },

  /**
   * Get file metadata
   */
  async getFileInfo(key: string): Promise<{ size: number; lastModified: Date; contentType?: string }> {
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
  async getUserStorageUsage(apiAccessKeyId: string): Promise<{ totalBytes: number; objectCount: number }> {
    const files = await this.listUserFiles(apiAccessKeyId);

    const totalBytes = files.reduce((sum, file) => sum + file.sizeInBytes, 0);
    const objectCount = files.length;

    return { totalBytes, objectCount };
  },

  /**
   * Validate if file belongs to user or API key (security check)
   */
  validateUserAccess(fileKey: string, apiAccessKeyId: string): boolean {
    return fileKey.startsWith(`${apiAccessKeyId}/`);
  },
};
