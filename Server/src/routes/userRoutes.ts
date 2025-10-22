import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";

import { getUserProfileController, getAccountSummaryController } from "../controllers/userControllers";

const router = Router();

// All user management routes require authentication and email verification
router.use(jwtAuth);

// User profile
router.get("/profile", getUserProfileController);

// Account management
router.get("/summary", getAccountSummaryController);

export { router as UserRouter };
