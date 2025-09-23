import { Request, Response, NextFunction } from "express";
import { UserRepository } from "../repositories/userRepository";
import { PockityErrorUnauthorized } from "../utils/response/PockityErrorClasses";

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user; // From JWT middleware

    if (!user) {
      throw new PockityErrorUnauthorized({
        message: "Authentication required",
        httpStatusCode: 401,
      });
    }

    if (user.role !== "ADMIN") {
      throw new PockityErrorUnauthorized({
        message: "Admin access required",
        httpStatusCode: 403,
      });
    }

    // Add user object to request for convenience
    req.adminUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
