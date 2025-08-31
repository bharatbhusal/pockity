import { Router } from "express";
import { 
  uploadFileController,
  deleteFileController,
  getFileController,
  listFilesController,
  getStorageUsageController,
  uploadMiddleware
} from "../controllers/storageControllers";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// All storage routes require authentication
router.use(jwtAuth);

// POST /storage/upload - Upload a file
router.post("/upload", uploadMiddleware, uploadFileController);

// GET /storage/files - List all user's files
router.get("/files", listFilesController);

// GET /storage/files/:fileName - Get a specific file (presigned URL)
router.get("/files/:fileName", getFileController);

// DELETE /storage/files/:fileName - Delete a file
router.delete("/files/:fileName", deleteFileController);

// GET /storage/usage - Get storage usage statistics
router.get("/usage", getStorageUsageController);

export { router as StorageRouter };