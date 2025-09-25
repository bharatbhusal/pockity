import { Router } from "express";
import { getGoogleOAuthURL } from "../utils/googleAuth";
import {
  logoutController,
  oAuthController,
  requestLoginController,
  requestRegisterController,
  verifyLoginController,
  verifyRegisterController,
} from "../controllers/authControllers";

const router = Router();

// POST /auth/register - User registration
router.post("/request-register", requestRegisterController);
router.post("/verify-register", verifyRegisterController);

// POST /auth/login - User login
router.post("/request-login", requestLoginController);
router.post("/verify-login", verifyLoginController);

router.get("/oauth-url", (req, res) => res.redirect(getGoogleOAuthURL()));
router.get("/google", oAuthController);

router.post("/logout", logoutController);

export { router as AuthRouter };
