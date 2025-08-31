import { Router } from "express";
import {
  uploadFileController,
  deleteFileController,
  getFileController,
  listFilesController,
  getStorageUsageController,
  getFileMetadataController,
  bulkDeleteFilesController,
  getStorageAnalyticsController,
  uploadMiddleware,
} from "../controllers/storageControllers";
import { jwtAuth } from "../middleware/jwtAuth";
import { apiKeyAuth } from "@/middleware/apiKeyAuth";

const router = Router();

// All storage routes require authentication
router.use(apiKeyAuth);

// POST /storage/upload - Upload a file
router.post("/upload", uploadMiddleware, uploadFileController);

// GET /storage/files - List all user's files
router.get("/files", listFilesController);

// GET /storage/files/:fileName - Get a specific file (presigned URL)
router.get("/files/:fileName", getFileController);

// GET /storage/files/:fileName/metadata - Get detailed file metadata
router.get("/files/:fileName/metadata", getFileMetadataController);

// DELETE /storage/files/:fileName - Delete a file
router.delete("/files/:fileName", deleteFileController);

// POST /storage/files/bulk-delete - Bulk delete files
router.post("/files/bulk-delete", bulkDeleteFilesController);

// GET /storage/usage - Get storage usage statistics
router.get("/usage", getStorageUsageController);

// GET /storage/analytics - Get storage analytics
router.get("/analytics", getStorageAnalyticsController);

export { router as StorageRouter };
