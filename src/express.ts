import express from "express";
import cors from "cors";

import { errorHandler } from "./utils/response/errorHandler";
import { OpenRouter } from "./routes/openRoutes";
import { AuthRouter } from "./routes/authRoutes";
import { ApiKeyRouter } from "./routes/apiKeyRoutes";
import { StorageRouter } from "./routes/storageRoutes";
import { UserRouter } from "./routes/userRoutes";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: "*",
  }),
);
app.use(express.json());

app.use("/api/open", OpenRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/apikeys", ApiKeyRouter);
app.use("/api/storage", StorageRouter);
app.use("/api/users", UserRouter);

app.use(errorHandler);

export { app as ExpressApplication };

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      adminUser?: any;
    }
  }
}
