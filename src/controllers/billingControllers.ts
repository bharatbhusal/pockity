import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BillingService } from "../services/billingService";
import { UserRepository } from "../repositories/userRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import {
  PockityErrorInvalidInput,
  PockityErrorNotFound,
  PockityErrorBadRequest,
} from "../utils/response/PockityErrorClasses";

// Validation schemas
const createSubscriptionSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
});

const createInvoiceSchema = z.object({
  amountCents: z.number().min(0, "Amount must be non-negative"),
  description: z.string().min(1, "Description is required"),
  dueAt: z.string().datetime().optional(),
});

const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
});

// Get available billing plans
export const getBillingPlansController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await BillingService.getAvailablePlans();

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Billing plans retrieved successfully",
        data: {
          plans,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get user's current subscription
export const getUserSubscriptionController = async (req: Request, res: Response, next: NextFunction) => {
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

    const subscription = await BillingService.getUserSubscription(userId);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Subscription retrieved successfully",
        data: {
          subscription,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Create a subscription
export const createSubscriptionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Validate request body
    const validationResult = createSubscriptionSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid subscription data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { planId } = validationResult.data;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    try {
      const subscription = await BillingService.createSubscription(userId, planId);

      res.status(201).json(
        new PockityBaseResponse({
          success: true,
          message: "Subscription created successfully",
          data: {
            subscription,
          },
        }),
      );
    } catch (error: any) {
      if (error.message?.includes("already has an active subscription")) {
        throw new PockityErrorBadRequest({
          message: "User already has an active subscription",
          httpStatusCode: 409,
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Cancel a subscription
export const cancelSubscriptionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Validate request body
    const validationResult = cancelSubscriptionSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid subscription data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { subscriptionId } = validationResult.data;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    try {
      const subscription = await BillingService.cancelSubscription(userId, subscriptionId);

      res.status(200).json(
        new PockityBaseResponse({
          success: true,
          message: "Subscription cancelled successfully",
          data: {
            subscription,
          },
        }),
      );
    } catch (error: any) {
      if (error.message?.includes("not found or not owned")) {
        throw new PockityErrorNotFound({
          message: "Subscription not found",
          httpStatusCode: 404,
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Get user's invoices
export const getUserInvoicesController = async (req: Request, res: Response, next: NextFunction) => {
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

    const invoices = await BillingService.getUserInvoices(userId, limit);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Invoices retrieved successfully",
        data: {
          invoices,
          totalInvoices: invoices.length,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Create an invoice
export const createInvoiceController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!; // From JWT middleware

    // Validate request body
    const validationResult = createInvoiceSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid invoice data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { amountCents, description, dueAt } = validationResult.data;

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    const invoice = await BillingService.createInvoice(
      userId,
      amountCents,
      description,
      dueAt ? new Date(dueAt) : undefined
    );

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "Invoice created successfully",
        data: {
          invoice,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get billing summary
export const getBillingSummaryController = async (req: Request, res: Response, next: NextFunction) => {
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

    const summary = await BillingService.getBillingSummary(userId);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Billing summary retrieved successfully",
        data: summary,
      }),
    );
  } catch (error) {
    next(error);
  }
};