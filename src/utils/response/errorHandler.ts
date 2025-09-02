import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { PockityBaseErrorClass } from "./PockityErrorClasses";

/**
 * Global error handler middleware for Express application
 * Catches all errors thrown in route handlers and formats them consistently
 * @param err - The error that was thrown
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Handle custom Pockity errors with structured response
  if (err instanceof PockityBaseErrorClass) {
    res.status(err.httpStatusCode).json({
      error: {
        name: err.name,
        message: err.message,
        statusCode: err.httpStatusCode,
        details: err.details,
      },
    });
    return;
  }

  // Handle unexpected errors with generic 500 response
  res.status(500).json({
    error: {
      name: "InternalServerError",
      message: "Unhandled Internal Server Error",
      statusCode: 500,
    },
  });
};
