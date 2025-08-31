import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PaymentService } from "../services/paymentService";
import { UserRepository } from "../repositories/userRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import {
  PockityErrorInvalidInput,
  PockityErrorNotFound,
  PockityErrorBadRequest,
} from "../utils/response/PockityErrorClasses";

// Validation schemas
const createPaymentIntentSchema = z.object({
  amountCents: z.number().min(0, "Amount must be non-negative"),
  currency: z.string().optional().default("usd"),
  provider: z.enum(["STRIPE", "RAZORPAY", "COINBASE_COMMERCE", "CUSTOM_CRYPTO_GATEWAY", "MANUAL"]).optional().default("MANUAL"),
  metadata: z.any().optional(),
});

const processPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment intent ID is required"),
  paymentMethodId: z.string().min(1, "Payment method ID is required"),
  metadata: z.any().optional(),
});

const addPaymentMethodSchema = z.object({
  type: z.enum(["CARD", "UPI", "BANK_TRANSFER", "ETH", "ERC20_USDC", "BTC", "SOL", "OTHER"]),
  provider: z.enum(["STRIPE", "RAZORPAY", "COINBASE_COMMERCE", "CUSTOM_CRYPTO_GATEWAY", "MANUAL"]),
  metadata: z.any().optional(),
});

const refundPaymentSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  amountCents: z.number().min(0, "Amount must be non-negative").optional(),
});

// Create a payment intent
export const createPaymentIntentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Validate request body
    const validationResult = createPaymentIntentSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid payment intent data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { amountCents, currency, provider, metadata } = validationResult.data;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const paymentIntent = await PaymentService.createPaymentIntent(
      userId,
      amountCents,
      currency,
      provider,
      metadata
    );

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "Payment intent created successfully",
        data: {
          paymentIntent,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Process a payment
export const processPaymentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Validate request body
    const validationResult = processPaymentSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid payment data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { paymentIntentId, paymentMethodId, metadata } = validationResult.data;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const result = await PaymentService.processPayment(userId, paymentIntentId, paymentMethodId, metadata);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Payment processed successfully",
        data: {
          result,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get payment methods
export const getPaymentMethodsController = async (req: Request, res: Response, next: NextFunction) => {
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

    const paymentMethods = await PaymentService.getPaymentMethods(userId);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Payment methods retrieved successfully",
        data: {
          paymentMethods,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Add a payment method
export const addPaymentMethodController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Validate request body
    const validationResult = addPaymentMethodSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid payment method data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { type, provider, metadata } = validationResult.data;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const paymentMethod = await PaymentService.addPaymentMethod(userId, type, provider, metadata);

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "Payment method added successfully",
        data: {
          paymentMethod,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get payment history
export const getPaymentHistoryController = async (req: Request, res: Response, next: NextFunction) => {
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

    const paymentHistory = await PaymentService.getPaymentHistory(userId, limit);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Payment history retrieved successfully",
        data: {
          payments: paymentHistory,
          totalPayments: paymentHistory.length,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Refund a payment
export const refundPaymentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Validate request body
    const validationResult = refundPaymentSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid refund data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { transactionId, amountCents } = validationResult.data;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const result = await PaymentService.refundPayment(userId, transactionId, amountCents);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Payment refunded successfully",
        data: {
          result,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};