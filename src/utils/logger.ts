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

// Write log messages to a file and console if env.LOG is true
export const logger = {
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
  error: ({ message, obj }: { message?: string; obj?: object }) => {
    if (env.LOG) {
      let logMessage = `\n[ERROR] [${new Date().toISOString()}]: `;
      if (message) logMessage += message;
      if (obj) logMessage += `\nErrorData: ${JSON.stringify(obj, null, 2)}`;
      console.error(logMessage);
      fs.appendFileSync(logFilePath, `${logMessage}\n`);
    }
  },
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
