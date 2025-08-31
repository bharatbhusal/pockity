import { Router } from "express";
import { getPublicTiersController, getAllTiersController } from "../controllers/tierControllers";
import { jwtAuth } from "../middleware/jwtAuth";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

// GET /tiers - Get public tiers (no auth required)
router.get("/", getPublicTiersController);

// Admin routes
router.get("/admin/all", jwtAuth, adminAuth, getAllTiersController);

export { router as TierRouter };