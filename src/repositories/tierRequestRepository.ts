import { prisma } from "../config/prisma";

export const TierRequestRepository = {
  create: (data: any) => prisma.tierRequest.create({ data }),
  findById: (id: string) => prisma.tierRequest.findUnique({ 
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      tier: { select: { id: true, name: true, priceCents: true } },
      admin: { select: { id: true, email: true, name: true } },
    }
  }),
  findByUserId: (userId: string) => prisma.tierRequest.findMany({ 
    where: { userId },
    include: {
      tier: { select: { id: true, name: true, priceCents: true } },
      admin: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' }
  }),
  findPendingByUserId: (userId: string) => prisma.tierRequest.findFirst({
    where: { userId, status: 'PENDING' }
  }),
  findByStatus: (status: string) => prisma.tierRequest.findMany({
    where: { status: status as any },
    include: {
      user: { select: { id: true, email: true, name: true } },
      tier: { select: { id: true, name: true, priceCents: true } },
      admin: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' }
  }),
  listWithDetails: () => prisma.tierRequest.findMany({
    include: {
      user: { select: { id: true, email: true, name: true } },
      tier: { select: { id: true, name: true, priceCents: true } },
      admin: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' }
  }),
  update: (id: string, data: any) => prisma.tierRequest.update({ where: { id }, data }),
  delete: (id: string) => prisma.tierRequest.delete({ where: { id } }),
  list: () => prisma.tierRequest.findMany(),
};
