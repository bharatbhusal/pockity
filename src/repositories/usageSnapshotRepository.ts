import { prisma } from "@/config/prisma";

export const UsageSnapshotRepository = {
  create: (data: any) => prisma.usageSnapshot.create({ data }),
  findById: (id: string) => prisma.usageSnapshot.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.usageSnapshot.update({ where: { id }, data }),
  delete: (id: string) => prisma.usageSnapshot.delete({ where: { id } }),
  list: () => prisma.usageSnapshot.findMany(),
};
