import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/authService";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { PockityErrorInvalidInput } from "../utils/response/PockityErrorClasses";
import { AuditLogService } from "../services/auditLogService";
import { getAuditContext } from "../utils/auditHelpers";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { email, password, name } = validationResult.data;
    const auditContext = getAuditContext(req);

    // Register user
    const authResponse = await AuthService.register({ email, password, name });

    // Log successful registration
    await AuditLogService.logUserRegister({
      userId: authResponse.user.id,
      email: authResponse.user.email,
      ...auditContext,
    });

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "User registered successfully",
        data: authResponse,
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { email, password } = validationResult.data;
    const auditContext = getAuditContext(req);

    try {
      // Login user
      const authResponse = await AuthService.login({ email, password });

      // Log successful login
      await AuditLogService.logUserAuth("USER_LOGIN", {
        userId: authResponse.user.id,
        email: authResponse.user.email,
        ...auditContext,
      });

      res.status(200).json(
        new PockityBaseResponse({
          success: true,
          message: "Login successful",
          data: authResponse,
        }),
      );
    } catch (loginError) {
      // Log failed login attempt
      await AuditLogService.logUserAuth("USER_LOGIN_FAILED", {
        email,
        failureReason: loginError instanceof Error ? loginError.message : "Unknown error",
        ...auditContext,
      });
      
      // Re-throw the error to be handled by the error handler
      throw loginError;
    }
  } catch (error) {
    next(error);
  }
};
