import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  createPaymentIntentController,
  processPaymentController,
  getPaymentMethodsController,
  addPaymentMethodController,
  getPaymentHistoryController,
  refundPaymentController,
} from "../controllers/paymentControllers";

const router = Router();

// All payment routes require authentication
router.use(jwtAuth);

// Payment intents
router.post("/intents", createPaymentIntentController);
router.post("/process", processPaymentController);

// Payment methods
router.get("/methods", getPaymentMethodsController);
router.post("/methods", addPaymentMethodController);

// Payment history
router.get("/history", getPaymentHistoryController);

// Refunds
router.post("/refund", refundPaymentController);

export { router as PaymentRouter };