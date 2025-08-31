import { ExpressApplication } from "./express";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function startServer() {
  try {
    const port = env.PORT;
    ExpressApplication.listen(port, () => {
      logger.info({ message: `Server running at http://localhost:${port}.` });
    });

    process.on("SIGTERM", async () => {
      logger.warn({ message: "SIGTERM received. Shutting down gracefully..." });
      process.exit(0);
    });
  } catch (error: any) {
    logger.error({ message: "Failed to start server: " + error });
  }
}

startServer();
