import { env } from "../config/env";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { PockityErrorAuthentication } from "./response/PockityErrorClasses";

export const generateToken = async (payload: JwtPayload): Promise<string> => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "30d",
    issuer: "pockity",
    audience: "pockity-users",
  });
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new PockityErrorAuthentication({
        message: "Authentication token has expired",
        httpStatusCode: 401,
      });
    } else if (error.name === "JsonWebTokenError") {
      throw new PockityErrorAuthentication({
        message: "Invalid authentication token",
        httpStatusCode: 401,
      });
    } else {
      throw new PockityErrorAuthentication({
        message: "Authentication failed",
        httpStatusCode: 401,
      });
    }
  }
};
