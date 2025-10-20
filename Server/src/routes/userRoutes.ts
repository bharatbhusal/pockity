import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";

import {
  getUserProfileController,
  updateUserProfileController,
  deleteUserAccountController,
  getAccountSummaryController,
} from "../controllers/userControllers";

const router = Router();

// All user management routes require authentication and email verification
router.use(jwtAuth);

// User profile
router.get("/profile", getUserProfileController);
router.put("/profile", updateUserProfileController);

// Account management
router.get("/summary", getAccountSummaryController);
router.delete("/account", deleteUserAccountController);

export { router as UserRouter };
