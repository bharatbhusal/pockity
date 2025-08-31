import express from "express";
import cors from "cors";

import { errorHandler } from "./utils/response/errorHandler";
import { OpenRouter } from "./routes/openRoutes";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: "*",
  }),
);
app.use(express.json());

app.use("/api/open", OpenRouter);

app.use(errorHandler);

export { app as ExpressApplication };

declare global {
  namespace Express {
    interface Request {
      user?: string;
    }
  }
}
