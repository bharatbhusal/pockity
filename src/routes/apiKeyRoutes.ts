import { Router } from "express";
import {
  listApiKeysController,
  revokeApiKeyController,
  getApiKeyController,
  createApiKeyCreateRequestController,
  getUserApiKeyRequestsController,
  getApiKeyRequestController,
  reviewApiKeyRequestController,
  getAllApiKeyRequestsController,
  createApiKeyUpgradeRequestController,
} from "../controllers/apiKeyControllers";
import { jwtAuth } from "../middleware/jwtAuth";
import { requireEmailVerification } from "../middleware/emailVerification";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

router.use(jwtAuth);
router.use(requireEmailVerification);

// API Key request routes
router.get("/request", getUserApiKeyRequestsController);
router.post("/request/create", createApiKeyCreateRequestController);
router.post("/request/upgrade", createApiKeyUpgradeRequestController);
router.get("/request/:id", getApiKeyRequestController);
router.get("/request/admin/all", adminAuth, getAllApiKeyRequestsController);
router.patch("/request/admin/review/:id", adminAuth, reviewApiKeyRequestController);

// API Key management routes
router.get("/", listApiKeysController);
router.get("/:id", getApiKeyController);
router.delete("/:id", revokeApiKeyController);

export { router as ApiKeyRouter };
