import { prisma } from "../config/prisma";

export const ApiKeyUpgradeRequestRepository = {
  create: (data: any) => prisma.apiKeyUpgradeRequest.create({ data }),
  findById: (id: string) =>
    prisma.apiKeyUpgradeRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        apiKey: {
          select: {
            id: true,
            accessKeyId: true,
            name: true,
            totalStorage: true,
            totalObjects: true,
          },
        },
      },
    }),
  findByUserId: (userId: string) =>
    prisma.apiKeyUpgradeRequest.findMany({
      where: { userId },
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
      },
      orderBy: { createdAt: "desc" },
    }),
  findByApiKeyId: (apiKeyId: string) =>
    prisma.apiKeyUpgradeRequest.findMany({
      where: { apiKeyId },
      orderBy: { createdAt: "desc" },
    }),
  findPending: () =>
    prisma.apiKeyUpgradeRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        apiKey: {
          select: {
            id: true,
            accessKeyId: true,
            name: true,
            totalStorage: true,
            totalObjects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  update: (id: string, data: any) =>
    prisma.apiKeyUpgradeRequest.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        apiKey: {
          select: {
            id: true,
            accessKeyId: true,
            name: true,
            totalStorage: true,
            totalObjects: true,
          },
        },
      },
    }),
  delete: (id: string) => prisma.apiKeyUpgradeRequest.delete({ where: { id } }),
  list: (filters?: { status?: string; userId?: string; limit?: number; offset?: number }) => {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;

    return prisma.apiKeyUpgradeRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        apiKey: {
          select: {
            id: true,
            accessKeyId: true,
            name: true,
            totalStorage: true,
            totalObjects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit,
      skip: filters?.offset,
    });
  },
};