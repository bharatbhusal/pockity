import { Router } from "express";
import { getGoogleOAuthURL } from "../utils/googleAuth";
import { logoutController, oAuthController } from "../controllers/authControllers";

const router = Router();

// OAuth routes
router.get("/oauth-url", (req, res) => res.redirect(getGoogleOAuthURL()));
router.get("/google", oAuthController);

// Logout route
router.post("/logout", logoutController);

export { router as AuthRouter };
