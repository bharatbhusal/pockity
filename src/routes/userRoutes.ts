import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  getUserProfileController,
  updateUserProfileController,
  changePasswordController,
  deleteUserAccountController,
  getAccountSummaryController,
} from "../controllers/userControllers";

const router = Router();

// All user management routes require authentication
router.use(jwtAuth);

// User profile
router.get("/profile", getUserProfileController);
router.put("/profile", updateUserProfileController);

// Password management
router.post("/change-password", changePasswordController);

// Account management
router.get("/summary", getAccountSummaryController);
router.delete("/account", deleteUserAccountController);

export { router as UserRouter };