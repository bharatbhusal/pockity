import { prisma } from "@/config/prisma";

export const UsageCurrentRepository = {
  create: (data: any) => prisma.usageCurrent.create({ data }),
  findById: (id: string) => prisma.usageCurrent.findUnique({ where: { id } }),
  findByUserId: (userId: string) => prisma.usageCurrent.findUnique({ where: { userId } }),
  update: (id: string, data: any) => prisma.usageCurrent.update({ where: { id }, data }),
  updateByUserId: (userId: string, data: any) => prisma.usageCurrent.update({ where: { userId }, data }),
  upsertByUserId: (userId: string, data: any) => prisma.usageCurrent.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  }),
  delete: (id: string) => prisma.usageCurrent.delete({ where: { id } }),
  list: () => prisma.usageCurrent.findMany(),
};
