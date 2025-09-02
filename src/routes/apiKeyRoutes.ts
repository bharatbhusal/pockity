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
} from "../controllers/apiKeyControllers";
import { jwtAuth } from "../middleware/jwtAuth";
import { requireEmailVerification } from "../middleware/emailVerification";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

router.use(jwtAuth);
router.use(requireEmailVerification);

router.get("/request", getUserApiKeyRequestsController);
router.post("/request", createApiKeyRequestController);
router.get("/request/:id", getApiKeyRequestController);
router.get("/request/admin/all", adminAuth, getAllApiKeyRequestsController);
router.patch("/request/admin/review/:id", adminAuth, reviewApiKeyRequestController);

router.get("/", listApiKeysController);
router.get("/:id", getApiKeyController);
router.delete("/:id", revokeApiKeyController);

export { router as ApiKeyRouter };
