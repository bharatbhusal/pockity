import { Router } from "express";
import {
  listApiKeysController,
  revokeApiKeyController,
  getApiKeyController,
  createApiKeyRequestController,
  getUserApiKeyRequestsController,
  getApiKeyRequestController,
  reviewApiKeyRequestController,
  getAllApiKeyRequestsController,
  createApiKeyUpgradeRequestController,
  getUserApiKeyUpgradeRequestsController,
  getApiKeyUpgradeRequestController,
  getAllApiKeyUpgradeRequestsController,
  reviewApiKeyUpgradeRequestController,
} from "../controllers/apiKeyControllers";
import { jwtAuth } from "../middleware/jwtAuth";
import { requireEmailVerification } from "../middleware/emailVerification";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

router.use(jwtAuth);
router.use(requireEmailVerification);

// API Key Request routes
router.get("/request", getUserApiKeyRequestsController);
router.post("/request", createApiKeyRequestController);
router.get("/request/:id", getApiKeyRequestController);
router.get("/request/admin/all", adminAuth, getAllApiKeyRequestsController);
router.patch("/request/admin/review/:id", adminAuth, reviewApiKeyRequestController);

// API Key Upgrade Request routes
router.get("/upgrade-request", getUserApiKeyUpgradeRequestsController);
router.post("/upgrade-request", createApiKeyUpgradeRequestController);
router.get("/upgrade-request/:id", getApiKeyUpgradeRequestController);
router.get("/upgrade-request/admin/all", adminAuth, getAllApiKeyUpgradeRequestsController);
router.patch("/upgrade-request/admin/review/:id", adminAuth, reviewApiKeyUpgradeRequestController);

// API Key management routes
router.get("/", listApiKeysController);
router.get("/:id", getApiKeyController);
router.delete("/:id", revokeApiKeyController);

export { router as ApiKeyRouter };
