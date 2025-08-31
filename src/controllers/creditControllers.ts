import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CreditService } from "../services/creditService";
import { UserRepository } from "../repositories/userRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import {
  PockityErrorInvalidInput,
  PockityErrorNotFound,
  PockityErrorBadRequest,
} from "../utils/response/PockityErrorClasses";

// Validation schemas
const addCreditsSchema = z.object({
  amountCents: z.number().min(1, "Amount must be positive"),
  source: z.string().min(1, "Source is required"),
  metadata: z.any().optional(),
});

const deductCreditsSchema = z.object({
  amountCents: z.number().min(1, "Amount must be positive"),
  reason: z.string().min(1, "Reason is required"),
});

// Get user's credit balance
export const getCreditBalanceController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const balance = await CreditService.getBalance(userId);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Credit balance retrieved successfully",
        data: {
          balance,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Add credits to user account
export const addCreditsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Validate request body
    const validationResult = addCreditsSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid credit data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { amountCents, source, metadata } = validationResult.data;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const transaction = await CreditService.addCredits(userId, amountCents, source, metadata);

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "Credits added successfully",
        data: {
          transaction,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Deduct credits from user account
export const deductCreditsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Validate request body
    const validationResult = deductCreditsSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid deduction data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { amountCents, reason } = validationResult.data;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    // Check if user has sufficient credits
    const hasSufficientCredits = await CreditService.hasSufficientCredits(userId, amountCents);
    if (!hasSufficientCredits) {
      throw new PockityErrorBadRequest({
        message: "Insufficient credits",
        httpStatusCode: 402,
      });
    }

    const success = await CreditService.deductCredits(userId, amountCents, reason);

    res.status(200).json(
      new PockityBaseResponse({
        success,
        message: "Credits deducted successfully",
        data: {
          deducted: success,
          amountCents,
          reason,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get credit transaction history
export const getCreditHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const transactions = await CreditService.getTransactionHistory(userId, limit);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Credit history retrieved successfully",
        data: {
          transactions,
          totalTransactions: transactions.length,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Check if user has sufficient credits
export const checkSufficientCreditsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware
    const requiredAmountCents = parseInt(req.query.amount as string) || 0;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    if (requiredAmountCents < 0) {
      throw new PockityErrorInvalidInput({
        message: "Amount must be non-negative",
        httpStatusCode: 400,
      });
    }

    const hasSufficientCredits = await CreditService.hasSufficientCredits(userId, requiredAmountCents);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Credit check completed",
        data: {
          hasSufficientCredits,
          requiredAmountCents,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};