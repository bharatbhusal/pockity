import { prisma } from "@/config/prisma";

export const UsageCurrentRepository = {
  create: (data: any) => prisma.usageCurrent.create({ data }),
  findById: (id: string) => prisma.usageCurrent.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.usageCurrent.update({ where: { id }, data }),
  delete: (id: string) => prisma.usageCurrent.delete({ where: { id } }),
  list: () => prisma.usageCurrent.findMany(),
};
