import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { OtpService } from "../services/otpService";
import { UserRepository } from "../repositories/userRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { PockityErrorInvalidInput, PockityErrorBadRequest } from "../utils/response/PockityErrorClasses";

// Validation schemas
const sendOtpSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
});

const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must contain only digits"),
});

// Send OTP to user's email
export const sendOtpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = sendOtpSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { email } = validationResult.data;
    const user = req.user;

    // Use email from request body or user's current email
    const targetEmail = email || user.email;

    // If email is provided and different from user's current email, validate it's not taken
    if (email && email !== user.email) {
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        throw new PockityErrorBadRequest({
          message: "Email is already taken by another user",
          httpStatusCode: 409,
        });
      }
    }

    // Send OTP
    await OtpService.sendOtp(user.id, targetEmail);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "OTP sent successfully to your email",
        data: {
          email: targetEmail,
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
    const validationResult = verifyOtpSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { otp } = validationResult.data;
    const user = req.user;

    // Verify OTP
    await OtpService.verifyOtp(user.id, otp);

    // Update user's email verification status
    const updatedUser = await UserRepository.update(user.id, {
      emailVerified: true,
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
