import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { PockityBaseErrorClass } from "./PockityErrorClasses";

export const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
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

  res.status(500).json({
    error: {
      name: "InternalServerError",
      message: "Unhandled Internal Server Error",
      statusCode: 500,
    },
  });
};
