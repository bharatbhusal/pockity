import { prisma } from "../config/prisma";

export const UsageCurrentRepository = {
  create: (data: any) => prisma.usageCurrent.create({ data }),
  findById: (id: string) => prisma.usageCurrent.findUnique({ where: { id } }),
  findByApiAccessKeyId: (apiAccessKeyId: string) => prisma.usageCurrent.findUnique({ where: { apiAccessKeyId } }),
  update: (id: string, data: any) => prisma.usageCurrent.update({ where: { id }, data }),
  updateByApiAccessKeyId: (apiAccessKeyId: string, data: any) =>
    prisma.usageCurrent.update({ where: { apiAccessKeyId }, data }),
  upsertByApiAccessKeyId: (apiAccessKeyId: string, data: any) =>
    prisma.usageCurrent.upsert({
      where: { apiAccessKeyId },
      create: {
        apiAccessKeyId,
        bytesUsed: data.bytesUsed?.increment ?? BigInt(0),
        objects: data.objects?.increment ?? 0,
        lastUpdated: new Date(),
      },
      update: data,
    }),
  delete: (id: string) => prisma.usageCurrent.delete({ where: { id } }),
  list: () => prisma.usageCurrent.findMany(),
};
