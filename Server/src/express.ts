import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./utils/response/errorHandler";
import { OpenRouter } from "./routes/openRoutes";
import { AuthRouter } from "./routes/authRoutes";
import { ApiKeyRouter } from "./routes/apiKeyRoutes";
import { StorageRouter } from "./routes/storageRoutes";
import { UserRouter } from "./routes/userRoutes";
import { AdminDashboardRouter } from "./routes/adminDashboardRoutes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // ✅ must be a string (not array) when credentials are used
    credentials: true, // ✅ enable cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // ✅ include OPTIONS for preflight
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"], // ✅ specify explicitly instead of "*"
  }),
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/open", OpenRouter);
app.use("/api/auth", AuthRouter);
app.use("/api/apiKeys", ApiKeyRouter);
app.use("/api/storage", StorageRouter);
app.use("/api/users", UserRouter);
app.use("/api/admin", AdminDashboardRouter);

app.use(errorHandler);

export { app as ExpressApplication };

// Optional type augmentation
declare global {
  namespace Express {
    interface Request {
      user?: any;
      adminUser?: any;
      apiAccessKeyId?: string;
    }
  }
}
