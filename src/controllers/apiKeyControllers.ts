import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { ApiKeyRepository } from "../repositories/apiKeyRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import {
  PockityErrorInvalidInput,
  PockityErrorNotFound,
  PockityErrorUnauthorized,
} from "../utils/response/PockityErrorClasses";
import { hashData } from "../utils/hash";
import { AuditLogService } from "../services/auditLogService";
import { ApiKeyRequestRepository } from "../repositories/apiKeyRequestRepository";
import { ApiKeyUpgradeRequestRepository } from "../repositories/apiKeyUpgradeRequestRepository";
import { PockityErrorBadRequest } from "../utils/response/PockityErrorClasses";
import { EmailService } from "../services/emailService";

const revokeApiKeySchema = z.object({
  id: z.string().min(1, "API key ID is required"),
});

// Validation schemas
const createApiKeyRequestSchema = z.object({
  keyName: z.string().min(1, "API key name is required").max(255, "Name too long"),
  requestedStorageGB: z.number().positive().max(1000, "Maximum 1000GB allowed"),
  requestedObjects: z.number().positive().max(1000000, "Maximum 1M objects allowed"),
  reason: z.string().min(10, "Please provide a detailed reason (min 10 characters)").max(500, "Reason too long"),
});

const reviewApiKeyRequestSchema = z.object({
  approved: z.boolean(),
  reviewerComment: z.string().max(500, "Comment too long").optional(),
});

// Validation schema for API key upgrade requests
const createApiKeyUpgradeRequestSchema = z.object({
  apiKeyId: z.string().min(1, "API key ID is required"),
  requestedStorageGB: z.number().positive().max(1000, "Maximum 1000GB allowed"),
  requestedObjects: z.number().positive().max(1000000, "Maximum 1M objects allowed"),
  reason: z.string().min(10, "Please provide a detailed reason (min 10 characters)").max(500, "Reason too long"),
});

const reviewUpgradeRequestSchema = z.object({
  approved: z.boolean(),
  reviewerComment: z.string().max(500, "Comment too long").optional(),
});

/**
 * List all API keys for the authenticated user
 * @param req - Express request object containing user information
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to a list of user's API keys (without secrets)
 */
export const listApiKeysController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get all API keys for the user
    const apiKeys = await ApiKeyRepository.findByUserId(req.user.id);

    // Don't return secret hashes
    const sanitizedKeys = apiKeys.map((key: any) => ({
      id: key.id,
      apiAccessKeyId: key.apiAccessKeyId,
      name: key.name,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      revokedAt: key.revokedAt,
    }));

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "API keys retrieved successfully",
        data: sanitizedKeys,
      }),
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke an API key belonging to the authenticated user
 * Once revoked, the API key becomes permanently inactive and cannot be used for storage operations
 * @param req - Express request object containing the API key ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to a success response
 */
export const revokeApiKeyController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request params
    const validationResult = revokeApiKeySchema.safeParse(req.params);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid API key ID",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { id } = validationResult.data;

    // Find the API key
    const apiKey = await ApiKeyRepository.findById(id);
    if (!apiKey) {
      throw new PockityErrorNotFound({
        message: "API key not found",
        httpStatusCode: 404,
      });
    }

    // Verify ownership
    if (apiKey.userId !== req.user.id) {
      throw new PockityErrorUnauthorized({
        message: "Unauthorized to revoke this API key",
        httpStatusCode: 403,
      });
    }

    // Revoke the API key
    const revokedKey = await ApiKeyRepository.update(id, {
      isActive: false,
      revokedAt: new Date(),
    });

    // Log API key revocation
    await AuditLogService.logApiKeyEvent("API_KEY_REVOKE", {
      apiKeyId: revokedKey.id,
      apiAccessKeyId: revokedKey.accessKeyId,
      userId: req.user.id,
      actorId: req.user.id,
      keyName: revokedKey.name || undefined,
    });

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "API key revoked successfully",
        data: {
          id: revokedKey.id,
          apiAccessKeyId: revokedKey.accessKeyId,
          name: revokedKey.name,
          isActive: revokedKey.isActive,
          revokedAt: revokedKey.revokedAt,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get details of a specific API key
 * Returns API key information without sensitive data like secret hash
 * @param req - Express request object containing the API key ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to API key details
 */
export const getApiKeyController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Find the API key
    const apiKey = await ApiKeyRepository.findById(id);
    if (!apiKey) {
      throw new PockityErrorNotFound({
        message: "API key not found",
        httpStatusCode: 404,
      });
    }

    // Verify ownership
    if (apiKey.userId !== req.user.id) {
      throw new PockityErrorUnauthorized({
        message: "Unauthorized to access this API key",
        httpStatusCode: 403,
      });
    }

    // Return API key details (without secret)
    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "API key retrieved successfully",
        data: {
          id: apiKey.id,
          apiAccessKeyId: apiKey.accessKeyId,
          name: apiKey.name,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt,
          lastUsedAt: apiKey.lastUsedAt,
          revokedAt: apiKey.revokedAt,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Create a new API key request
/**
 * Create a new API key request
 * Users must request API keys with specific storage and object limits before they can be created
 * Admins will review and approve/reject these requests
 * @param req - Express request object containing request details (storage, objects, reason, keyName)
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to the created API key request
 */
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

    const { requestedStorageGB, requestedObjects, reason, keyName } = validationResult.data;
    const user = req.user;

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
    const requestedStorage = BigInt(Math.ceil(requestedStorageGB * 1024 * 1024 * 1024));

    // Create the request
    const apiKeyRequest = await ApiKeyRequestRepository.create({
      userId: user.id,
      keyName,
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
        keyName,
      },
    });

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "API key request submitted successfully. Admin will review your request.",
        data: {
          request: {
            id: apiKeyRequest.id,
            keyName: apiKeyRequest.keyName,
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
/**
 * Get all API key requests for the authenticated user
 * Returns a list of API key requests made by the user with their current status
 * @param req - Express request object containing user information
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to user's API key requests
 */
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
/**
 * Get all API key requests across all users (admin only)
 * Allows administrators to view and manage all pending, approved, and rejected API key requests
 * @param req - Express request object with optional status query parameter
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to all API key requests
 */
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
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// Admin: Approve or reject API key request
/**
 * Review an API key request (admin only)
 * Allows administrators to approve or reject API key requests
 * When approved, creates a new API key with the requested limits and emails the credentials to the user
 * @param req - Express request object containing approval decision and optional reviewer comment
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to the updated request with review decision
 */
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

    if (approved) {
      // Generate API key pair
      const apiAccessKeyId = `pk_${crypto.randomBytes(16).toString("hex")}`;
      const secretKey = `sk_${crypto.randomBytes(32).toString("hex")}`;

      // Hash the secret key before storing
      const secretHash = await hashData(secretKey);

      await ApiKeyRepository.create({
        accessKeyId: apiAccessKeyId,
        secretHash,
        name: apiKeyRequest.keyName,
        userId: apiKeyRequest.userId,
        totalStorage: apiKeyRequest.requestedStorage,
        totalObjects: apiKeyRequest.requestedObjects,
      });

      await EmailService.sendKeyPairEmail(apiKeyRequest.user.email, apiAccessKeyId, secretKey);

      // Log API key creation
      await AuditLogService.logApiKeyEvent("API_KEY_CREATE", {
        apiKeyId: apiKeyRequest.id,
        apiAccessKeyId: apiAccessKeyId,
        userId: req.user.id,
        actorId: admin.id,
        keyName: apiKeyRequest.keyName || undefined,
      });
    }

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
/**
 * Get details of a specific API key request
 * Users can view their own requests, admins can view any request
 * @param req - Express request object containing the request ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to the API key request details
 */
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

/**
 * Create a new API key upgrade request
 * Allows existing API key owners to request storage/object limit increases
 */
export const createApiKeyUpgradeRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = createApiKeyUpgradeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid upgrade request data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { apiKeyId, requestedStorageGB, requestedObjects, reason } = validationResult.data;
    const user = req.user;

    // Find the API key and verify ownership
    const apiKey = await ApiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throw new PockityErrorNotFound({
        message: "API key not found",
        httpStatusCode: 404,
      });
    }

    // Verify the user owns this API key
    if (apiKey.userId !== user.id) {
      throw new PockityErrorUnauthorized({
        message: "You can only request upgrades for your own API keys",
        httpStatusCode: 403,
      });
    }

    // Check if API key is active
    if (!apiKey.isActive || apiKey.revokedAt) {
      throw new PockityErrorBadRequest({
        message: "Cannot request upgrade for inactive or revoked API key",
        httpStatusCode: 400,
      });
    }

    // Check if there's already a pending upgrade request for this API key
    const hasPending = await ApiKeyUpgradeRequestRepository.hasPendingRequest(apiKeyId);
    if (hasPending) {
      throw new PockityErrorBadRequest({
        message: "You already have a pending upgrade request for this API key",
        httpStatusCode: 409,
      });
    }

    // Convert GB to bytes
    const requestedStorage = BigInt(Math.ceil(requestedStorageGB * 1024 * 1024 * 1024));

    // Validate that requested limits are higher than current limits
    if (requestedStorage <= apiKey.totalStorage) {
      throw new PockityErrorBadRequest({
        message: "Requested storage must be higher than current storage limit",
        httpStatusCode: 400,
      });
    }

    if (requestedObjects <= apiKey.totalObjects) {
      throw new PockityErrorBadRequest({
        message: "Requested object count must be higher than current object limit",
        httpStatusCode: 400,
      });
    }

    // Create the upgrade request
    const upgradeRequest = await ApiKeyUpgradeRequestRepository.create({
      apiKeyId,
      userId: user.id,
      currentStorage: apiKey.totalStorage,
      currentObjects: apiKey.totalObjects,
      requestedStorage,
      requestedObjects,
      reason,
    });

    // Log the upgrade request creation
    await AuditLogService.log({
      action: "API_KEY_UPGRADE_REQUEST",
      actorId: user.id,
      detail: `User requested upgrade for API key ${apiKey.accessKeyId} to ${requestedStorageGB}GB storage and ${requestedObjects} objects`,
      metadata: {
        upgradeRequestId: upgradeRequest.id,
        apiKeyId: apiKey.id,
        currentStorageGB: Number(apiKey.totalStorage) / (1024 * 1024 * 1024),
        currentObjects: apiKey.totalObjects,
        requestedStorageGB,
        requestedObjects,
      },
    });

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "API key upgrade request submitted successfully. Admin will review your request.",
        data: {
          request: {
            id: upgradeRequest.id,
            apiKey: {
              id: upgradeRequest.apiKey.id,
              accessKeyId: upgradeRequest.apiKey.accessKeyId,
              name: upgradeRequest.apiKey.name,
            },
            currentStorageGB: Number(upgradeRequest.currentStorage) / (1024 * 1024 * 1024),
            currentObjects: upgradeRequest.currentObjects,
            requestedStorageGB: Number(upgradeRequest.requestedStorage) / (1024 * 1024 * 1024),
            requestedObjects: upgradeRequest.requestedObjects,
            reason: upgradeRequest.reason,
            status: upgradeRequest.status,
            createdAt: upgradeRequest.createdAt,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's API key upgrade requests
 */
/**
 * Get user's API key upgrade requests
 * Returns all upgrade requests made by the authenticated user for their existing API keys
 * @param req - Express request object containing user information
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to user's API key upgrade requests
 */
export const getUserApiKeyUpgradeRequestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const upgradeRequests = await ApiKeyUpgradeRequestRepository.findByUserId(user.id);

    const formattedRequests = upgradeRequests.map((request: any) => ({
      id: request.id,
      apiKey: {
        id: request.apiKey.id,
        accessKeyId: request.apiKey.accessKeyId,
        name: request.apiKey.name,
      },
      currentStorageGB: Number(request.currentStorage) / (1024 * 1024 * 1024),
      currentObjects: request.currentObjects,
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
        message: "API key upgrade requests retrieved successfully",
        data: { requests: formattedRequests },
      }),
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific API key upgrade request
 */
/**
 * Get specific API key upgrade request
 * Users can view their own upgrade requests, admins can view any upgrade request
 * @param req - Express request object containing the upgrade request ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to the upgrade request details
 */
export const getApiKeyUpgradeRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const upgradeRequest = await ApiKeyUpgradeRequestRepository.findById(id);
    if (!upgradeRequest) {
      throw new PockityErrorNotFound({
        message: "Upgrade request not found",
        httpStatusCode: 404,
      });
    }

    // Check if user is authorized to view this request (owner or admin)
    if (upgradeRequest.userId !== user.id && user.role !== "ADMIN") {
      throw new PockityErrorUnauthorized({
        message: "You can only view your own upgrade requests",
        httpStatusCode: 403,
      });
    }

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "Upgrade request retrieved successfully",
        data: {
          request: {
            id: upgradeRequest.id,
            apiKey: upgradeRequest.apiKey,
            user: user.role === "ADMIN" ? upgradeRequest.user : undefined,
            currentStorageGB: Number(upgradeRequest.currentStorage) / (1024 * 1024 * 1024),
            currentObjects: upgradeRequest.currentObjects,
            requestedStorageGB: Number(upgradeRequest.requestedStorage) / (1024 * 1024 * 1024),
            requestedObjects: upgradeRequest.requestedObjects,
            reason: upgradeRequest.reason,
            status: upgradeRequest.status,
            reviewerComment: upgradeRequest.reviewerComment,
            reviewedAt: upgradeRequest.reviewedAt,
            createdAt: upgradeRequest.createdAt,
          },
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all API key upgrade requests (admin only)
 */
/**
 * Get all API key upgrade requests (admin only)
 * Allows administrators to view and manage all API key upgrade requests across all users
 * @param req - Express request object with optional status query parameter
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise that resolves to all API key upgrade requests
 */
export const getAllApiKeyUpgradeRequestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const upgradeRequests = await ApiKeyUpgradeRequestRepository.findAll(status as string);

    const formattedRequests = upgradeRequests.map((request: any) => ({
      id: request.id,
      apiKey: request.apiKey,
      user: request.user,
      currentStorageGB: Number(request.currentStorage) / (1024 * 1024 * 1024),
      currentObjects: request.currentObjects,
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
        message: "All API key upgrade requests retrieved successfully",
        data: { requests: formattedRequests },
      }),
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Review an API key upgrade request (admin only)
 */
export const reviewApiKeyUpgradeRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = reviewUpgradeRequestSchema.safeParse(req.body);
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

    // Find the upgrade request
    const upgradeRequest = await ApiKeyUpgradeRequestRepository.findById(id);
    if (!upgradeRequest) {
      throw new PockityErrorNotFound({
        message: "Upgrade request not found",
        httpStatusCode: 404,
      });
    }

    // Check if already reviewed
    if (upgradeRequest.status !== "PENDING") {
      throw new PockityErrorBadRequest({
        message: "This upgrade request has already been reviewed",
        httpStatusCode: 409,
      });
    }

    // Update the upgrade request
    const updatedRequest = await ApiKeyUpgradeRequestRepository.update(id, {
      status: approved ? "APPROVED" : "REJECTED",
      reviewerId: admin.id,
      reviewerComment,
      reviewedAt: new Date(),
    });

    if (approved) {
      // Update the API key limits
      await ApiKeyRepository.updateLimits(upgradeRequest.apiKeyId, {
        totalStorage: upgradeRequest.requestedStorage,
        totalObjects: upgradeRequest.requestedObjects,
      });

      // Log API key upgrade approval
      await AuditLogService.log({
        action: "API_KEY_UPGRADE_APPROVE",
        actorId: admin.id,
        detail: `Admin approved upgrade for API key ${upgradeRequest.apiKey.accessKeyId}`,
        metadata: {
          upgradeRequestId: id,
          apiKeyId: upgradeRequest.apiKeyId,
          userId: upgradeRequest.userId,
          oldStorageGB: Number(upgradeRequest.currentStorage) / (1024 * 1024 * 1024),
          oldObjects: upgradeRequest.currentObjects,
          newStorageGB: Number(upgradeRequest.requestedStorage) / (1024 * 1024 * 1024),
          newObjects: upgradeRequest.requestedObjects,
          reviewerComment,
        },
      });
    } else {
      // Log API key upgrade rejection
      await AuditLogService.log({
        action: "API_KEY_UPGRADE_REJECT",
        actorId: admin.id,
        detail: `Admin rejected upgrade for API key ${upgradeRequest.apiKey.accessKeyId}`,
        metadata: {
          upgradeRequestId: id,
          apiKeyId: upgradeRequest.apiKeyId,
          userId: upgradeRequest.userId,
          reviewerComment,
        },
      });
    }

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: `Upgrade request ${approved ? "approved" : "rejected"} successfully`,
        data: {
          request: {
            id: updatedRequest.id,
            apiKey: updatedRequest.apiKey,
            user: updatedRequest.user,
            currentStorageGB: Number(updatedRequest.currentStorage) / (1024 * 1024 * 1024),
            currentObjects: updatedRequest.currentObjects,
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
