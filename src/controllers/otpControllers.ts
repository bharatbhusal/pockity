import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { OtpService } from "../services/otpService";
import { UserRepository } from "../repositories/userRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { PockityErrorInvalidInput } from "../utils/response/PockityErrorClasses";
import { AuditLogService } from "../services/auditLogService";
import { getAuditContext } from "../utils/auditHelpers";

const verifyOtpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

// Send OTP to user's email
export const sendOtpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (user.emailVerified) {
      return res.status(400).json(
        new PockityBaseResponse({
          success: true,
          message: "Email is already verified",
          data: { email: user.email },
        }),
      );
    } else await OtpService.sendOtp(user.id, user.email);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "OTP sent successfully to your email",
        data: {
          email: user.email,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Verify OTP and mark email as verified
export const verifyOtpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = verifyOtpSchema.safeParse(req.params);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { otp } = validationResult.data;
    const user = req.user;
    const auditContext = getAuditContext(req);

    // Verify OTP
    await OtpService.verifyOtp(user.id, otp);

    // Update user's email verification status
    const updatedUser = await UserRepository.update(user.id, {
      emailVerified: true,
    });

    // Log email verification event
    await AuditLogService.logEmailVerified({
      userId: user.id,
      email: user.email,
      ...auditContext,
    });

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Email verified successfully",
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            emailVerified: updatedUser.emailVerified,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};
