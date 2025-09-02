import { PrismaClient } from "@prisma/client";
import { PockityErrorDatabase } from "../utils/response/PockityErrorClasses";

const prisma = new PrismaClient();

/**
 * Repository for managing API key upgrade requests
 */
export class ApiKeyUpgradeRequestRepository {
  /**
   * Create a new API key upgrade request
   * @param data - The upgrade request data
   * @returns The created upgrade request
   */
  static async create(data: {
    apiKeyId: string;
    userId: string;
    currentStorage: bigint;
    currentObjects: number;
    requestedStorage: bigint;
    requestedObjects: number;
    reason?: string;
  }) {
    try {
      return await prisma.apiKeyUpgradeRequest.create({
        data,
        include: {
          apiKey: {
            select: {
              id: true,
              accessKeyId: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (error: any) {
      throw new PockityErrorDatabase({
        message: "Failed to create API key upgrade request",
        details: error.message,
        httpStatusCode: 500,
      });
    }
  }

  /**
   * Find upgrade requests by user ID
   * @param userId - The user ID
   * @returns List of upgrade requests for the user
   */
  static async findByUserId(userId: string) {
    try {
      return await prisma.apiKeyUpgradeRequest.findMany({
        where: { userId },
        include: {
          apiKey: {
            select: {
              id: true,
              accessKeyId: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      throw new PockityErrorDatabase({
        message: "Failed to fetch user's upgrade requests",
        details: error.message,
        httpStatusCode: 500,
      });
    }
  }

  /**
   * Find upgrade requests by API key ID
   * @param apiKeyId - The API key ID
   * @returns List of upgrade requests for the API key
   */
  static async findByApiKeyId(apiKeyId: string) {
    try {
      return await prisma.apiKeyUpgradeRequest.findMany({
        where: { apiKeyId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      throw new PockityErrorDatabase({
        message: "Failed to fetch API key upgrade requests",
        details: error.message,
        httpStatusCode: 500,
      });
    }
  }

  /**
   * Find upgrade request by ID
   * @param id - The upgrade request ID
   * @returns The upgrade request if found
   */
  static async findById(id: string) {
    try {
      return await prisma.apiKeyUpgradeRequest.findUnique({
        where: { id },
        include: {
          apiKey: {
            select: {
              id: true,
              accessKeyId: true,
              name: true,
              totalStorage: true,
              totalObjects: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (error: any) {
      throw new PockityErrorDatabase({
        message: "Failed to fetch upgrade request",
        details: error.message,
        httpStatusCode: 500,
      });
    }
  }

  /**
   * Get all upgrade requests (for admin)
   * @param status - Optional status filter
   * @returns List of all upgrade requests
   */
  static async findAll(status?: string) {
    try {
      const whereClause = status ? { status: status as any } : {};
      
      return await prisma.apiKeyUpgradeRequest.findMany({
        where: whereClause,
        include: {
          apiKey: {
            select: {
              id: true,
              accessKeyId: true,
              name: true,
              totalStorage: true,
              totalObjects: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      throw new PockityErrorDatabase({
        message: "Failed to fetch all upgrade requests",
        details: error.message,
        httpStatusCode: 500,
      });
    }
  }

  /**
   * Update an upgrade request
   * @param id - The upgrade request ID
   * @param data - The update data
   * @returns The updated upgrade request
   */
  static async update(id: string, data: {
    status?: string;
    reviewerId?: string;
    reviewerComment?: string;
    reviewedAt?: Date;
  }) {
    try {
      return await prisma.apiKeyUpgradeRequest.update({
        where: { id },
        data,
        include: {
          apiKey: {
            select: {
              id: true,
              accessKeyId: true,
              name: true,
              totalStorage: true,
              totalObjects: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (error: any) {
      throw new PockityErrorDatabase({
        message: "Failed to update upgrade request",
        details: error.message,
        httpStatusCode: 500,
      });
    }
  }

  /**
   * Check if there's a pending upgrade request for an API key
   * @param apiKeyId - The API key ID
   * @returns True if there's a pending request
   */
  static async hasPendingRequest(apiKeyId: string): Promise<boolean> {
    try {
      const pendingRequest = await prisma.apiKeyUpgradeRequest.findFirst({
        where: {
          apiKeyId,
          status: "PENDING",
        },
      });
      return !!pendingRequest;
    } catch (error: any) {
      throw new PockityErrorDatabase({
        message: "Failed to check for pending upgrade requests",
        details: error.message,
        httpStatusCode: 500,
      });
    }
  }
}