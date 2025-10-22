import { Request, Response, NextFunction, CookieOptions } from "express";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { AuditAction, AuditLogService } from "../services/auditLogService";
import { AuthService } from "../services/authService";
import { getGoogleOAuthTokens, getGoogleUser } from "../utils/googleAuth";
import { env } from "../config/env";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  domain: process.env.NODE_ENV === "production" ? ".bharatbhusal.com" : undefined,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const oAuthController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    const { id_token, access_token } = await getGoogleOAuthTokens(code as string);
    const googleUser = await getGoogleUser({ id_token, access_token });
    const authResponse = await AuthService.oAuth(googleUser);

    await AuditLogService.logUserAuth(AuditAction.USER_ONBOARD, {
      userId: authResponse.user.id,
      email: authResponse.user.email,
    });

    res.cookie("authToken", authResponse.token, cookieOptions);
    res.redirect(env.FRONTEND_URL);
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("authToken", cookieOptions);
    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Logged out successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};
