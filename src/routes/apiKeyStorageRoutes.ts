import { Router } from "express";
import { 
  apiKeyUploadFileController,
  apiKeyDeleteFileController,
  apiKeyGetFileController,
  apiKeyListFilesController,
  apiKeyGetStorageUsageController,
  apiKeyUploadMiddleware
} from "../controllers/apiKeyStorageControllers";
import { apiKeyAuth } from "../middleware/apiKeyAuth";

const router = Router();

// All API key storage routes require API key authentication
router.use(apiKeyAuth);

// POST /v1/storage/upload - Upload a file using API key
router.post("/upload", apiKeyUploadMiddleware, apiKeyUploadFileController);

// GET /v1/storage/files - List all user's files using API key
router.get("/files", apiKeyListFilesController);

// GET /v1/storage/files/:fileName - Get a specific file (presigned URL) using API key
router.get("/files/:fileName", apiKeyGetFileController);

// DELETE /v1/storage/files/:fileName - Delete a file using API key
router.delete("/files/:fileName", apiKeyDeleteFileController);

// GET /v1/storage/usage - Get storage usage statistics using API key
router.get("/usage", apiKeyGetStorageUsageController);

export { router as ApiKeyStorageRouter };