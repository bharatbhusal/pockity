import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { adminAuth } from "../middleware/adminAuth";
import {
  getSystemHealthController,
  getUserAnalyticsController,
  getSystemAuditLogsController,
  getApiKeyOverviewController,
} from "../controllers/adminDashboardControllers";

const router = Router();

// All admin dashboard routes require JWT auth + admin privileges
router.use(jwtAuth);
router.use(adminAuth);

// System health and overview
router.get("/health", getSystemHealthController);

// User management and analytics
router.get("/users", getUserAnalyticsController);

// API key management
router.get("/api-keys", getApiKeyOverviewController);

// Audit logs and system monitoring
router.get("/audit-logs", getSystemAuditLogsController);

export { router as AdminDashboardRouter };
