import express from "express";
import cors from "cors";

import { errorHandler } from "./utils/response/errorHandler";
import { OpenRouter } from "./routes/openRoutes";
import { AuthRouter } from "./routes/authRoutes";
import { ApiKeyRouter } from "./routes/apiKeyRoutes";
import { TierRequestRouter } from "./routes/tierRequestRoutes";
import { StorageRouter } from "./routes/storageRoutes";
import { TierRouter } from "./routes/tierRoutes";
import { BillingRouter } from "./routes/billingRoutes";
import { PaymentRouter } from "./routes/paymentRoutes";
import { CreditRouter } from "./routes/creditRoutes";

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
app.use("/api/tier-requests", TierRequestRouter);
app.use("/api/storage", StorageRouter);
app.use("/api/tiers", TierRouter);
app.use("/api/billing", BillingRouter);
app.use("/api/payments", PaymentRouter);
app.use("/api/credits", CreditRouter);

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
