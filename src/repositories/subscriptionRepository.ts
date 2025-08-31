import { prisma } from "@/config/prisma";

export const SubscriptionRepository = {
  create: (data: any) => prisma.subscription.create({ data }),
  findById: (id: string) => prisma.subscription.findUnique({ where: { id } }),
  findByUserId: (userId: string) => prisma.subscription.findUnique({ where: { userId } }),
  findActiveByUserId: (userId: string) => prisma.subscription.findFirst({
    where: { 
      userId,
      status: { in: ['ACTIVE', 'TRIALING'] }
    },
    include: {
      tier: true
    }
  }),
  update: (id: string, data: any) => prisma.subscription.update({ where: { id }, data }),
  delete: (id: string) => prisma.subscription.delete({ where: { id } }),
  list: () => prisma.subscription.findMany(),
};
