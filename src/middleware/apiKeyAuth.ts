import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { ApiKeyRepository } from "../repositories/apiKeyRepository";
import { PockityErrorAuthentication } from "../utils/response/PockityErrorClasses";

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract API key credentials from headers
    const accessKeyId = req.headers["x-access-key-id"] as string;
    const secretKey = req.headers["x-secret-key"] as string;

    if (!accessKeyId || !secretKey) {
      throw new PockityErrorAuthentication({
        message: "API key credentials are required. Provide x-access-key-id and x-secret-key headers.",
        httpStatusCode: 401,
      });
    }

    // Find the API key in database
    const apiKey = await ApiKeyRepository.findByAccessKey(accessKeyId);
    if (!apiKey) {
      throw new PockityErrorAuthentication({
        message: "Invalid API key",
        httpStatusCode: 401,
      });
    }

    // Check if API key is active
    if (!apiKey.isActive || apiKey.revokedAt) {
      throw new PockityErrorAuthentication({
        message: "API key is inactive or revoked",
        httpStatusCode: 401,
      });
    }

    // Verify the secret key
    const isValidSecret = await bcrypt.compare(secretKey, apiKey.secretHash);
    if (!isValidSecret) {
      throw new PockityErrorAuthentication({
        message: "Invalid API key credentials",
        httpStatusCode: 401,
      });
    }

    // Update API key last used timestamp
    await ApiKeyRepository.update(apiKey.id, {
      lastUsedAt: new Date(),
    });

    // Add user information and API key information to request object
    req.userId = apiKey.userId;
    req.accessKeyId = apiKey.accessKeyId;

    next();
  } catch (error) {
    next(error);
  }
};
