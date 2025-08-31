import { Router } from "express";
import {
  createTierRequestController,
  getUserTierRequestsController,
  getAllTierRequestsController,
  approveTierRequestController,
} from "../controllers/tierRequestControllers";
import { jwtAuth } from "../middleware/jwtAuth";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

// User routes (require authentication)
router.use(jwtAuth);

// POST /tier-requests - Create a new tier request
router.post("/", createTierRequestController);

// GET /tier-requests - Get user's own tier requests
router.get("/", getUserTierRequestsController);

// Admin routes (require admin authentication)
router.get("/admin/all", adminAuth, getAllTierRequestsController);
router.patch("/admin/:id/approve", adminAuth, approveTierRequestController);

export { router as TierRequestRouter };
