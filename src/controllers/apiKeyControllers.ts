import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { ApiKeyRepository } from "../repositories/apiKeyRepository";
import { S3Service } from "../services/s3Service";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import {
  PockityErrorInvalidInput,
  PockityErrorNotFound,
  PockityErrorUnauthorized,
} from "../utils/response/PockityErrorClasses";
import { hashData } from "../utils/hash";
import { AuditLogService } from "../services/auditLogService";
import { getAuditContext } from "../utils/auditHelpers";

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1, "API key name is required").max(255, "Name too long"),
});

const revokeApiKeySchema = z.object({
  id: z.string().min(1, "API key ID is required"),
});

export const createApiKeyController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validationResult = createApiKeySchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new PockityErrorInvalidInput({
        message: "Invalid input data",
        details: validationResult.error.errors,
        httpStatusCode: 400,
      });
    }

    const { name } = validationResult.data;
    const auditContext = getAuditContext(req);

    // Verify user exists

    if (!req.user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    // Generate API key pair
    const apiAccessKeyId = `pk_${crypto.randomBytes(16).toString("hex")}`;
    const secretKey = `sk_${crypto.randomBytes(32).toString("hex")}`;

    // Hash the secret key before storing
    const secretHash = await hashData(secretKey);

    // Create API key in database
    const apiKey = await ApiKeyRepository.create({
      accessKeyId: apiAccessKeyId,
      secretHash,
      name,
      userId: req.user.id,
    });

    // Log API key creation
    await AuditLogService.logApiKeyEvent("API_KEY_CREATE", {
      apiKeyId: apiKey.id,
      apiAccessKeyId: apiKey.accessKeyId,
      userId: req.user.id,
      actorId: req.user.id,
      keyName: name,
      ...auditContext,
    });

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "API key created successfully",
        data: {
          id: apiKey.id,
          apiAccessKeyId: apiKey.accessKeyId,
          secretKey, // Only shown once during creation
          name: apiKey.name,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

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
    const auditContext = getAuditContext(req);

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
      keyName: revokedKey.name,
      ...auditContext,
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
