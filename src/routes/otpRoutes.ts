import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { sendOtpController, verifyOtpController } from "../controllers/otpControllers";

const router = Router();

// All OTP routes require authentication
router.use(jwtAuth);

// POST /otp/send - Send OTP to user's email
router.post("/send", sendOtpController);

// POST /otp/verify - Verify OTP and mark email as verified
router.post("/verify/:otp", verifyOtpController);

export { router as OtpRouter };
