import { Router } from "express";
import { healthController } from "../controllers/openControllers";

const router = Router();

router.get("/health", healthController);

export { router as OpenRouter };
