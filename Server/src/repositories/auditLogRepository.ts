import { prisma } from "../config/prisma";

export const AuditLogRepository = {
  create: (data: any) => prisma.auditLog.create({ data }),
  findById: (id: string) => prisma.auditLog.findUnique({ where: { id } }),
  findByApiAccessKeyId: (apiAccessKeyId: string) => prisma.auditLog.findMany({ where: { apiAccessKeyId } }),
  update: (id: string, data: any) => prisma.auditLog.update({ where: { id }, data }),
  delete: (id: string) => prisma.auditLog.delete({ where: { id } }),
  list: (filters?: { limit?: number; offset?: number }) => {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: filters?.limit,
      skip: filters?.offset,
    });
  },
};
