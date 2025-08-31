import { prisma } from "@/config/prisma";

export const TierRequestRepository = {
  create: (data: any) => prisma.tierRequest.create({ data }),
  findById: (id: string) => prisma.tierRequest.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.tierRequest.update({ where: { id }, data }),
  delete: (id: string) => prisma.tierRequest.delete({ where: { id } }),
  list: () => prisma.tierRequest.findMany(),
};
