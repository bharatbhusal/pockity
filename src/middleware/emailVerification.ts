import { Request, Response, NextFunction } from "express";
import { PockityErrorForbidden } from "../utils/response/PockityErrorClasses";

export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user) {
    throw new PockityErrorForbidden({
      message: "Authentication required",
      httpStatusCode: 401,
    });
  }

  if (!user.emailVerified) {
    throw new PockityErrorForbidden({
      message: "Email verification is required to access this resource. Please verify your email first.",
      httpStatusCode: 403,
    });
  }

  next();
};
