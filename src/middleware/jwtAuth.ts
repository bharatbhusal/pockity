import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { PockityErrorAuthentication } from "../utils/response/PockityErrorClasses";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const jwtAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new PockityErrorAuthentication({
        message: "Authentication token is required",
        httpStatusCode: 401,
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      throw new PockityErrorAuthentication({
        message: "Authentication token is required",
        httpStatusCode: 401,
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Add user information to request object
    req.userId = decoded.userId;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      next(
        new PockityErrorAuthentication({
          message: "Authentication token has expired",
          httpStatusCode: 401,
        }),
      );
    } else if (error.name === "JsonWebTokenError") {
      next(
        new PockityErrorAuthentication({
          message: "Invalid authentication token",
          httpStatusCode: 401,
        }),
      );
    } else {
      next(error);
    }
  }
};
