import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { adminAuth } from "../middleware/adminAuth";
import {
  createApiKeyRequestController,
  getUserApiKeyRequestsController,
  getApiKeyRequestController,
  getAllApiKeyRequestsController,
  reviewApiKeyRequestController,
} from "../controllers/apiKeyRequestControllers";

const router = Router();

// User routes (require authentication)
router.post("/", jwtAuth, createApiKeyRequestController);
router.get("/", jwtAuth, getUserApiKeyRequestsController);
router.get("/:id", jwtAuth, getApiKeyRequestController);

// Admin routes (require admin privileges)
router.get("/admin/all", jwtAuth, adminAuth, getAllApiKeyRequestsController);
router.patch("/admin/:id/review", jwtAuth, adminAuth, reviewApiKeyRequestController);

export { router as ApiKeyRequestRouter };