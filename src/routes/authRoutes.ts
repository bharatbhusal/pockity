import { Router } from "express";
import { registerController, loginController } from "../controllers/authControllers";

const router = Router();

// POST /auth/register - User registration
router.post("/register", registerController);

// POST /auth/login - User login
router.post("/login", loginController);

export { router as AuthRouter };