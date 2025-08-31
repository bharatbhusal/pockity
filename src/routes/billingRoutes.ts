import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  getBillingPlansController,
  getUserSubscriptionController,
  createSubscriptionController,
  cancelSubscriptionController,
  getUserInvoicesController,
  createInvoiceController,
  getBillingSummaryController,
} from "../controllers/billingControllers";

const router = Router();

// All billing routes require authentication
router.use(jwtAuth);

// Billing plans
router.get("/plans", getBillingPlansController);

// Subscriptions
router.get("/subscription", getUserSubscriptionController);
router.post("/subscription", createSubscriptionController);
router.post("/subscription/cancel", cancelSubscriptionController);

// Invoices
router.get("/invoices", getUserInvoicesController);
router.post("/invoices", createInvoiceController);

// Billing summary
router.get("/summary", getBillingSummaryController);

export { router as BillingRouter };