import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TierRequestRepository } from "../repositories/tierRequestRepository";
import { TierRepository } from "../repositories/tierRepository";
import { UserRepository } from "../repositories/userRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { PockityErrorInvalidInput, PockityErrorNotFound, PockityErrorBadRequest } from "../utils/response/PockityErrorClasses";

// Validation schemas
const createTierRequestSchema = z.object({
  tierId: z.string().min(1, "Tier ID is required"),
  reason: z.string().optional(),
});

const approveTierRequestSchema = z.object({
  id: z.string().min(1, "Tier request ID is required"),
  approved: z.boolean(),
  reason: z.string().optional(),
});

// User endpoint: Request a tier upgrade
export const createTierRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = createTierRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { tierId, reason } = validationResult.data;
    const userId = req.user!; // From JWT middleware

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    // Verify tier exists
    const tier = await TierRepository.findById(tierId);
    if (!tier) {
      throw new PockityErrorNotFound({
        message: "Tier not found",
        httpStatusCode: 404,
      });
    }

    // Check if user already has a pending request
    const existingRequest = await TierRequestRepository.findPendingByUserId(userId);
    if (existingRequest) {
      throw new PockityErrorBadRequest({
        message: "You already have a pending tier request",
        httpStatusCode: 400,
      });
    }

    // Create tier request
    const tierRequest = await TierRequestRepository.create({
      userId,
      tierId,
      reason,
      status: "PENDING",
    });

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "Tier request created successfully",
        data: {
          id: tierRequest.id,
          userId: tierRequest.userId,
          tierId: tierRequest.tierId,
          reason: tierRequest.reason,
          status: tierRequest.status,
          createdAt: tierRequest.createdAt,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// User endpoint: Get own tier requests
export const getUserTierRequestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!; // From JWT middleware

    const tierRequests = await TierRequestRepository.findByUserId(userId);

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Tier requests retrieved successfully",
        data: tierRequests,
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Admin endpoint: Get all tier requests
export const getAllTierRequestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    let tierRequests;
    if (status && typeof status === 'string') {
      tierRequests = await TierRequestRepository.findByStatus(status.toUpperCase());
    } else {
      tierRequests = await TierRequestRepository.listWithDetails();
    }

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Tier requests retrieved successfully",
        data: tierRequests,
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Admin endpoint: Approve or reject tier request
export const approveTierRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = approveTierRequestSchema.safeParse({ ...req.params, ...req.body });
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { id, approved, reason } = validationResult.data;
    const adminId = req.user!; // From JWT middleware (admin)

    // Find the tier request
    const tierRequest = await TierRequestRepository.findById(id);
    if (!tierRequest) {
      throw new PockityErrorNotFound({
        message: "Tier request not found",
        httpStatusCode: 404,
      });
    }

    // Check if already resolved
    if (tierRequest.status !== "PENDING") {
      throw new PockityErrorBadRequest({
        message: "Tier request has already been resolved",
        httpStatusCode: 400,
      });
    }

    // Update tier request
    const updatedRequest = await TierRequestRepository.update(id, {
      status: approved ? "APPROVED" : "REJECTED",
      adminId,
      resolvedAt: new Date(),
    });

    // If approved, we might want to create a subscription or update user's tier
    // For now, we'll just mark the request as approved
    // In a real implementation, you'd create a subscription here

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: `Tier request ${approved ? 'approved' : 'rejected'} successfully`,
        data: {
          id: updatedRequest.id,
          status: updatedRequest.status,
          adminId: updatedRequest.adminId,
          resolvedAt: updatedRequest.resolvedAt,
          reason: reason || null,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};