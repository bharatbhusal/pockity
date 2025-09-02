import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiKeyRequestRepository } from "../repositories/apiKeyRequestRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import {
  PockityErrorInvalidInput,
  PockityErrorNotFound,
  PockityErrorUnauthorized,
  PockityErrorBadRequest,
} from "../utils/response/PockityErrorClasses";
import { AuditLogService } from "../services/auditLogService";
import { getAuditContext } from "../utils/auditHelpers";

// Validation schemas
const createApiKeyRequestSchema = z.object({
  requestedStorageGB: z.number().positive().max(1000, "Maximum 1000GB allowed"),
  requestedObjects: z.number().positive().max(1000000, "Maximum 1M objects allowed"),
  reason: z.string().min(10, "Please provide a detailed reason (min 10 characters)").max(500, "Reason too long"),
});

const reviewApiKeyRequestSchema = z.object({
  approved: z.boolean(),
  reviewerComment: z.string().max(500, "Comment too long").optional(),
});

// Create a new API key request
export const createApiKeyRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = createApiKeyRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid request data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { requestedStorageGB, requestedObjects, reason } = validationResult.data;
    const user = req.user;
    const auditContext = getAuditContext(req);

    // Check if user already has a pending request
    const existingRequests = await ApiKeyRequestRepository.findByUserId(user.id);
    const pendingRequest = existingRequests.find((request: any) => request.status === "PENDING");
    
    if (pendingRequest) {
      throw new PockityErrorBadRequest({
        message: "You already have a pending API key request. Please wait for admin review.",
        httpStatusCode: 409,
      });
    }

    // Convert GB to bytes
    const requestedStorage = BigInt(requestedStorageGB * 1024 * 1024 * 1024);

    // Create the request
    const apiKeyRequest = await ApiKeyRequestRepository.create({
      userId: user.id,
      requestedStorage,
      requestedObjects,
      reason,
      status: "PENDING",
    });

    // Log the request creation
    await AuditLogService.log({
      action: "API_KEY_REQUEST_CREATE",
      actorId: user.id,
      detail: `User requested API key with ${requestedStorageGB}GB storage and ${requestedObjects} objects`,
      metadata: {
        requestId: apiKeyRequest.id,
        requestedStorageGB,
        requestedObjects,
        reason,
      },
      ...auditContext,
    });

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "API key request submitted successfully. Admin will review your request.",
        data: {
          request: {
            id: apiKeyRequest.id,
            requestedStorageGB,
            requestedObjects,
            reason: apiKeyRequest.reason,
            status: apiKeyRequest.status,
            createdAt: apiKeyRequest.createdAt,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get user's API key requests
export const getUserApiKeyRequestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const requests = await ApiKeyRequestRepository.findByUserId(user.id);

    const formattedRequests = requests.map((request: any) => ({
      id: request.id,
      requestedStorageGB: Number(request.requestedStorage) / (1024 * 1024 * 1024),
      requestedObjects: request.requestedObjects,
      reason: request.reason,
      status: request.status,
      reviewerComment: request.reviewerComment,
      reviewedAt: request.reviewedAt,
      createdAt: request.createdAt,
    }));

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "API key requests retrieved successfully",
        data: { requests: formattedRequests },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Admin: Get all API key requests
export const getAllApiKeyRequestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    const filters: any = {
      limit: Number(limit),
      offset: Number(offset),
    };
    
    if (status && typeof status === "string") {
      filters.status = status.toUpperCase();
    }

    const requests = await ApiKeyRequestRepository.list(filters);

    const formattedRequests = requests.map((request: any) => ({
      id: request.id,
      user: {
        id: request.user.id,
        email: request.user.email,
        name: request.user.name,
      },
      requestedStorageGB: Number(request.requestedStorage) / (1024 * 1024 * 1024),
      requestedObjects: request.requestedObjects,
      reason: request.reason,
      status: request.status,
      reviewerComment: request.reviewerComment,
      reviewedAt: request.reviewedAt,
      createdAt: request.createdAt,
    }));

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "API key requests retrieved successfully",
        data: { 
          requests: formattedRequests,
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            total: formattedRequests.length,
          }
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Admin: Approve or reject API key request
export const reviewApiKeyRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = reviewApiKeyRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid review data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { approved, reviewerComment } = validationResult.data;
    const { id } = req.params;
    const admin = req.adminUser; // From adminAuth middleware
    const auditContext = getAuditContext(req);

    // Find the request
    const apiKeyRequest = await ApiKeyRequestRepository.findById(id);
    if (!apiKeyRequest) {
      throw new PockityErrorNotFound({
        message: "API key request not found",
        httpStatusCode: 404,
      });
    }

    // Check if already reviewed
    if (apiKeyRequest.status !== "PENDING") {
      throw new PockityErrorBadRequest({
        message: "This request has already been reviewed",
        httpStatusCode: 409,
      });
    }

    // Update the request
    const updatedRequest = await ApiKeyRequestRepository.update(id, {
      status: approved ? "APPROVED" : "REJECTED",
      reviewerId: admin.id,
      reviewerComment,
      reviewedAt: new Date(),
    });

    // Log the admin action
    await AuditLogService.logAdminAction({
      adminId: admin.id,
      action: approved ? "API_KEY_REQUEST_APPROVE" : "API_KEY_REQUEST_REJECT",
      targetId: apiKeyRequest.userId,
      details: `${approved ? "Approved" : "Rejected"} API key request for ${apiKeyRequest.user.email}`,
      metadata: {
        requestId: id,
        requestedStorageGB: Number(apiKeyRequest.requestedStorage) / (1024 * 1024 * 1024),
        requestedObjects: apiKeyRequest.requestedObjects,
        reviewerComment,
      },
      ...auditContext,
    });

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: `API key request ${approved ? "approved" : "rejected"} successfully`,
        data: {
          request: {
            id: updatedRequest.id,
            user: updatedRequest.user,
            requestedStorageGB: Number(updatedRequest.requestedStorage) / (1024 * 1024 * 1024),
            requestedObjects: updatedRequest.requestedObjects,
            reason: updatedRequest.reason,
            status: updatedRequest.status,
            reviewerComment: updatedRequest.reviewerComment,
            reviewedAt: updatedRequest.reviewedAt,
            createdAt: updatedRequest.createdAt,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Get a specific API key request
export const getApiKeyRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const apiKeyRequest = await ApiKeyRequestRepository.findById(id);
    if (!apiKeyRequest) {
      throw new PockityErrorNotFound({
        message: "API key request not found",
        httpStatusCode: 404,
      });
    }

    // Check if user owns the request (unless they're admin)
    if (user.role !== "ADMIN" && apiKeyRequest.userId !== user.id) {
      throw new PockityErrorUnauthorized({
        message: "Unauthorized to view this request",
        httpStatusCode: 403,
      });
    }

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "API key request retrieved successfully",
        data: {
          request: {
            id: apiKeyRequest.id,
            user: user.role === "ADMIN" ? apiKeyRequest.user : undefined,
            requestedStorageGB: Number(apiKeyRequest.requestedStorage) / (1024 * 1024 * 1024),
            requestedObjects: apiKeyRequest.requestedObjects,
            reason: apiKeyRequest.reason,
            status: apiKeyRequest.status,
            reviewerComment: apiKeyRequest.reviewerComment,
            reviewedAt: apiKeyRequest.reviewedAt,
            createdAt: apiKeyRequest.createdAt,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};