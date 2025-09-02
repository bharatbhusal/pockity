import { Request } from "express";

/**
 * Extract client IP address from request
 */
export function getClientIP(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    (req.headers["x-real-ip"] as string) ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: Request): string {
  return req.headers["user-agent"] || "unknown";
}

/**
 * Extract audit context from request
 */
export function getAuditContext(req: Request) {
  return {
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  };
}