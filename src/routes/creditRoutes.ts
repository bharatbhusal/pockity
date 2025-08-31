import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  getCreditBalanceController,
  addCreditsController,
  deductCreditsController,
  getCreditHistoryController,
  checkSufficientCreditsController,
} from "../controllers/creditControllers";

const router = Router();

// All credit routes require authentication
router.use(jwtAuth);

// Credit balance
router.get("/balance", getCreditBalanceController);

// Credit transactions
router.post("/add", addCreditsController);
router.post("/deduct", deductCreditsController);

// Credit history
router.get("/history", getCreditHistoryController);

// Credit checks
router.get("/check", checkSufficientCreditsController);

export { router as CreditRouter };