import { prisma } from "../config/prisma";

export const ApiKeyRequestRepository = {
  create: (data: any) => prisma.apiKeyRequest.create({ data }),
  findById: (id: string) => prisma.apiKeyRequest.findUnique({ 
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        }
      }
    }
  }),
  findByUserId: (userId: string) => prisma.apiKeyRequest.findMany({ 
    where: { userId },
    orderBy: { createdAt: 'desc' }
  }),
  findPending: () => prisma.apiKeyRequest.findMany({ 
    where: { status: 'PENDING' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  }),
  update: (id: string, data: any) => prisma.apiKeyRequest.update({ 
    where: { id }, 
    data,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        }
      }
    }
  }),
  delete: (id: string) => prisma.apiKeyRequest.delete({ where: { id } }),
  list: (filters?: {
    status?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) => {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;

    return prisma.apiKeyRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });
  },
};