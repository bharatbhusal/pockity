import { Router } from "express";
import {
  createApiKeyController,
  listApiKeysController,
  revokeApiKeyController,
  getApiKeyController,
} from "../controllers/apiKeyControllers";
import { jwtAuth } from "../middleware/jwtAuth";
import { requireEmailVerification } from "../middleware/emailVerification";

const router = Router();

// All API key routes require authentication and email verification
router.use(jwtAuth);
router.use(requireEmailVerification);

// POST /apikeys - Create new API key
router.post("/", createApiKeyController);

// GET /apikeys - List user's API keys
router.get("/", listApiKeysController);

// GET /apikeys/:id - Get specific API key
router.get("/:id", getApiKeyController);

// DELETE /apikeys/:id - Revoke API key
router.delete("/:id", revokeApiKeyController);

export { router as ApiKeyRouter };
