import { prisma } from "@/config/prisma";

export const TierRepository = {
  create: (data: any) => prisma.tier.create({ data }),
  findById: (id: string) => prisma.tier.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.tier.update({ where: { id }, data }),
  delete: (id: string) => prisma.tier.delete({ where: { id } }),
  list: () => prisma.tier.findMany(),
};
