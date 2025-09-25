import { Request, Response, NextFunction, CookieOptions } from "express";
import { z } from "zod";
import { AuthService } from "../services/authService";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { PockityErrorInvalidInput } from "../utils/response/PockityErrorClasses";
import { AuditAction, AuditLogService } from "../services/auditLogService";
import { OtpService } from "../services/otpService";
import { UserRepository } from "../repositories";
import { getGoogleOAuthTokens, getGoogleUser } from "../utils/googleAuth";
import { env } from "../config/env";

// Validation schemas
const requestRegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
});
const verifyRegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().optional(),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

const requestLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
});
const verifyLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  domain: process.env.NODE_ENV === "production" ? ".bharatbhusal.com" : undefined,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const requestRegisterController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = requestRegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { email } = validationResult.data;
    const user = await UserRepository.findByEmail(email);
    if (user) {
      return res.status(400).json(
        new PockityBaseResponse({
          success: false,
          message: "Email is already registered",
        }),
      );
    }

    // Register user
    await OtpService.sendOtp(email, "REGISTER");

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "Registration OTP sent successfully. Check your email.",
        data: {
          email,
          purpose: "REGISTER",
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};
export const verifyRegisterController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = verifyRegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { email, password, name, otp } = validationResult.data;
    await OtpService.verifyOtp(email, otp, "REGISTER");

    // Register user
    const authResponse = await AuthService.register({ email, password, name });

    // Log successful registration
    await AuditLogService.logUserAuth(AuditAction.USER_REGISTER, {
      userId: authResponse.user.id,
      email: authResponse.user.email,
    });
    res.cookie("authToken", authResponse.token, cookieOptions);

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "User registered successfully",
        data: { user: authResponse.user },
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const requestLoginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = requestLoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { email } = validationResult.data;

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(400).json(
        new PockityBaseResponse({
          success: false,
          message: "Email is not registered",
        }),
      );
    }
    // Login user
    await OtpService.sendOtp(email, "LOGIN");

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "OTP sent successfully. Check your email.",
        data: { email, purpose: "LOGIN" },
      }),
    );
  } catch (error) {
    next(error);
  }
};
export const verifyLoginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = verifyLoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { email, password, otp } = validationResult.data;
    await OtpService.verifyOtp(email, otp, "LOGIN");

    // Login user
    const authResponse = await AuthService.login({ email, password });
    // Log successful login
    await AuditLogService.logUserAuth(AuditAction.USER_LOGIN, {
      userId: authResponse.user.id,
      email: authResponse.user.email,
    });

    res.cookie("authToken", authResponse.token, cookieOptions);
    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Login successful",
        data: { user: authResponse.user },
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const oAuthController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    const { id_token, access_token } = await getGoogleOAuthTokens(code as string);
    const googleUser = await getGoogleUser({ id_token, access_token });
    const authResponse = await AuthService.oAuth(googleUser);
    res.cookie("authToken", authResponse.token, cookieOptions);
    // res.status(200).json(
    //   new PockityBaseResponse({
    //     success: true,
    //     message: "Login successful",
    //     data: { user: authResponse.user },
    //   }),
    // );
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
