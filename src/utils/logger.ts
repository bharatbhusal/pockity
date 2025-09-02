import fs from "fs";
import path from "path";
import { env } from "../config/env";

const logFilePath = path.join(__dirname, "../logs/server.log");

// Only check/create the directory if env.LOG is true
if (env.LOG && !fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), {
    recursive: true,
  });
}

/**
 * Simple logging utility for the Pockity application
 * Logs messages to both console and file system when LOG environment variable is enabled
 * Note: IP addresses and user agents are intentionally not logged for privacy
 */
export const logger = {
  /**
   * Log informational messages
   * @param params - Logging parameters
   * @param params.message - Optional message to log
   * @param params.obj - Optional object to log as JSON
   */
  info: ({ message, obj }: { message?: string; obj?: object }) => {
    if (env.LOG) {
      let logMessage = `[INFO] [${new Date().toISOString()}]: `;
      if (message) logMessage += message;
      if (obj) logMessage += `\nData: ${JSON.stringify(obj, null, 2)}`;
      console.log(logMessage);
      fs.appendFile(logFilePath, `${logMessage}\n`, (err) => {
        if (err) console.error("Failed to write log:", err);
      });
    }
  },

  /**
   * Log error messages
   * @param params - Logging parameters
   * @param params.message - Optional error message to log
   * @param params.obj - Optional error object to log as JSON
   */
  error: ({ message, obj }: { message?: string; obj?: object }) => {
    if (env.LOG) {
      let logMessage = `\n[ERROR] [${new Date().toISOString()}]: `;
      if (message) logMessage += message;
      if (obj) logMessage += `\nErrorData: ${JSON.stringify(obj, null, 2)}`;
      console.error(logMessage);
      fs.appendFileSync(logFilePath, `${logMessage}\n`);
    }
  },

  /**
   * Log warning messages
   * @param params - Logging parameters
   * @param params.message - Optional warning message to log
   * @param params.obj - Optional warning object to log as JSON
   */
  warn: ({ message, obj }: { message?: string; obj?: object }) => {
    if (env.LOG) {
      let logMessage = `\n[WARN] [${new Date().toISOString()}]: `;
      if (message) logMessage += message;
      if (obj) logMessage += `\nData: ${JSON.stringify(obj, null, 2)}`;
      console.warn(logMessage);
      fs.appendFileSync(logFilePath, `${logMessage}\n`);
    }
  },
};
