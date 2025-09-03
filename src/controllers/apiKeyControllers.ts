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
import { API_REQUEST_TYPE, AuditAction, AuditLogService } from "../services/auditLogService";
import { ApiKeyRequestRepository } from "../repositories/apiKeyRequestRepository";
import { PockityErrorBadRequest } from "../utils/response/PockityErrorClasses";
import { EmailService } from "../services/emailService";

const revokeApiKeySchema = z.object({
  id: z.string().min(1, "API key ID is required"),
});

// Validation schemas
const createApiKeyCreateRequestSchema = z.object({
  keyName: z.string().min(1, "API key name is required").max(255, "Name too long"),
  requestedStorageGB: z.number().positive().max(1000, "Maximum 1000GB allowed"),
  requestedObjects: z.number().positive().max(1000000, "Maximum 1M objects allowed"),
  reason: z.string().min(10, "Please provide a detailed reason (min 10 characters)").max(500, "Reason too long"),
});
const createApiKeyUpgradeRequestSchema = z.object({
  apiAccessKeyId: z.string().min(1, "API access key ID is required"),
  requestedStorageGB: z.number().positive().max(1000, "Maximum 1000GB allowed"),
  requestedObjects: z.number().positive().max(1000000, "Maximum 1M objects allowed"),
  reason: z.string().min(10, "Please provide a detailed reason (min 10 characters)").max(500, "Reason too long"),
});

const reviewApiKeyRequestSchema = z.object({
  approved: z.boolean(),
  reviewerComment: z.string().max(500, "Comment too long").optional(),
});

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
    await AuditLogService.logApiKeyEvent(AuditAction.API_KEY_REVOKE, {
      apiAccessKeyId: revokedKey.accessKeyId,
      userId: apiKey.userId,
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
export const createApiKeyCreateRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = createApiKeyCreateRequestSchema.safeParse(req.body);
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
    });

    // Log the request creation
    await AuditLogService.logApiKeyEvent(AuditAction.API_KEY_REQUEST_CREATE, {
      userId: apiKeyRequest.userId,
      actorId: user,
      keyName,
      requestType: apiKeyRequest.requestType as API_REQUEST_TYPE,
    });

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "API key create request submitted successfully. Admin will review your request.",
        data: {
          request: {
            id: apiKeyRequest.id,
            keyName: apiKeyRequest.keyName,
            requestType: apiKeyRequest.requestType,
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

// Create a new API key request
export const createApiKeyUpgradeRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = createApiKeyUpgradeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid request data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { requestedStorageGB, requestedObjects, reason, apiAccessKeyId } = validationResult.data;
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
    const apiKey = await ApiKeyRepository.findByAccessKeyId(apiAccessKeyId);
    if (!apiKey) {
      throw new PockityErrorBadRequest({ message: "API access key ID not found", httpStatusCode: 404 });
    }
    // Validate that requested limits are higher than current limits
    if (requestedStorage <= apiKey.totalStorage) {
      throw new PockityErrorBadRequest({
        message: "Requested storage must be higher than current storage limit",
        httpStatusCode: 400,
        details: { current: apiKey.totalStorage, requested: requestedStorage },
      });
    }

    if (requestedObjects <= apiKey.totalObjects) {
      throw new PockityErrorBadRequest({
        message: "Requested objects must be higher than current objects limit",
        httpStatusCode: 400,
        details: { current: apiKey.totalObjects, requested: requestedObjects },
      });
    }

    const apiKeyRequest = await ApiKeyRequestRepository.create({
      userId: apiKey?.userId,
      requestedStorage,
      requestedObjects,
      reason,
      requestType: API_REQUEST_TYPE.UPGRADE,
      apiAccessKeyId,
    });

    // Log the request creation
    await AuditLogService.logApiKeyEvent(AuditAction.API_KEY_REQUEST_CREATE, {
      apiAccessKeyId: apiKey.accessKeyId,
      userId: apiKeyRequest.userId,
      actorId: user.id,
      requestType: API_REQUEST_TYPE.UPGRADE,
    });

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "API key upgrade request submitted successfully. Admin will review your request.",
        data: {
          request: {
            id: apiKeyRequest.id,
            apiAccessKeyId: apiKeyRequest.apiAccessKeyId,
            requestType: apiKeyRequest.requestType,
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
      requestType: request.requestType,
      keyName: request.keyName || undefined,
      apiAccessKeyId: request.apiAccessKeyId || undefined,
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
      requestType: request.requestType || undefined,
      keyName: request.keyName || undefined,
      apiAccessKeyId: request.apiAccessKeyId || undefined,
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
      status: approved ? AuditAction.API_KEY_REQUEST_APPROVE : AuditAction.API_KEY_REQUEST_REJECT,
      reviewerId: admin.id,
      reviewerComment,
      reviewedAt: new Date(),
    });

    if (approved) {
      if (apiKeyRequest.requestType === API_REQUEST_TYPE.CREATE) {
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

        await EmailService.sendApiCreateRequestStatus(apiKeyRequest.user.email, apiAccessKeyId, secretKey);

        // Log API key creation
        await AuditLogService.logApiKeyEvent(AuditAction.API_KEY_REQUEST_APPROVE, {
          apiAccessKeyId: apiAccessKeyId,
          userId: req.user.id,
          actorId: admin.id,
          keyName: apiKeyRequest.keyName || undefined,
          requestType: API_REQUEST_TYPE.CREATE,
        });
      } else if (apiKeyRequest.requestType === API_REQUEST_TYPE.UPGRADE) {
        await ApiKeyRepository.updateLimitsByApiAccessKeyId(
          apiKeyRequest.apiAccessKeyId!,
          apiKeyRequest.requestedStorage,
          apiKeyRequest.requestedObjects,
        );
        await EmailService.sendApiUpgradeRequestStatus(
          apiKeyRequest.user.email,
          apiKeyRequest.apiAccessKeyId!,
          "approved",
        );

        // Log API key creation
        await AuditLogService.logApiKeyEvent(AuditAction.API_KEY_REQUEST_APPROVE, {
          apiAccessKeyId: apiKeyRequest.apiAccessKeyId || undefined,
          userId: req.user.id,
          actorId: admin.id,
          requestType: API_REQUEST_TYPE.UPGRADE,
        });
      }
    } else {
      // Log API key creation
      await AuditLogService.logApiKeyEvent(AuditAction.API_KEY_REQUEST_REJECT, {
        apiAccessKeyId: apiKeyRequest.apiAccessKeyId || undefined,
        userId: req.user.id,
        actorId: admin.id,
        keyName: apiKeyRequest.keyName || undefined,
        requestType: apiKeyRequest.requestType as API_REQUEST_TYPE,
      });
    }

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
