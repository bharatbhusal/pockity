import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { ApiKeyRepository } from "../repositories/apiKeyRepository";
import { UserRepository } from "../repositories/userRepository";
import { PockityBaseResponse } from "../utils/response/PockityResponseClass";
import { PockityErrorInvalidInput, PockityErrorNotFound, PockityErrorUnauthorized } from "../utils/response/PockityErrorClasses";

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1, "API key name is required").max(255, "Name too long"),
  tierId: z.string().optional(),
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

    const { name, tierId } = validationResult.data;
    const userId = req.user!; // From JWT middleware

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new PockityErrorNotFound({
        message: "User not found",
        httpStatusCode: 404,
      });
    }

    // Generate API key pair
    const accessKeyId = `pk_${crypto.randomBytes(16).toString('hex')}`;
    const secretKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    
    // Hash the secret key before storing
    const secretHash = await bcrypt.hash(secretKey, 12);

    // Create API key in database
    const apiKey = await ApiKeyRepository.create({
      accessKeyId,
      secretHash,
      name,
      userId,
      tierId: tierId || null,
    });

    res.status(201).json(
      new PockityBaseResponse({
        success: true,
        message: "API key created successfully",
        data: {
          id: apiKey.id,
          accessKeyId: apiKey.accessKeyId,
          secretKey, // Only shown once during creation
          name: apiKey.name,
          tierId: apiKey.tierId,
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
    const userId = req.user!; // From JWT middleware

    // Get all API keys for the user
    const apiKeys = await ApiKeyRepository.findByUserId(userId);

    // Don't return secret hashes
    const sanitizedKeys = apiKeys.map((key: any) => ({
      id: key.id,
      accessKeyId: key.accessKeyId,
      name: key.name,
      tierId: key.tierId,
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
    const userId = req.user!; // From JWT middleware

    // Find the API key
    const apiKey = await ApiKeyRepository.findById(id);
    if (!apiKey) {
      throw new PockityErrorNotFound({
        message: "API key not found",
        httpStatusCode: 404,
      });
    }

    // Verify ownership
    if (apiKey.userId !== userId) {
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

    res.status(200).json(
      new PockityBaseResponse({
        success: true,
        message: "API key revoked successfully",
        data: {
          id: revokedKey.id,
          accessKeyId: revokedKey.accessKeyId,
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
    const userId = req.user!; // From JWT middleware

    // Find the API key
    const apiKey = await ApiKeyRepository.findById(id);
    if (!apiKey) {
      throw new PockityErrorNotFound({
        message: "API key not found",
        httpStatusCode: 404,
      });
    }

    // Verify ownership
    if (apiKey.userId !== userId) {
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
          accessKeyId: apiKey.accessKeyId,
          name: apiKey.name,
          tierId: apiKey.tierId,
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