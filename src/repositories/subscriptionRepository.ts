import { prisma } from "@/config/prisma";

export const SubscriptionRepository = {
  create: (data: any) => prisma.subscription.create({ data }),
  findById: (id: string) => prisma.subscription.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.subscription.update({ where: { id }, data }),
  delete: (id: string) => prisma.subscription.delete({ where: { id } }),
  list: () => prisma.subscription.findMany(),
};
