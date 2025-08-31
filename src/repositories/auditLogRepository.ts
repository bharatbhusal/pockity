import { prisma } from "@/config/prisma";

export const AuditLogRepository = {
  create: (data: any) => prisma.auditLog.create({ data }),
  findById: (id: string) => prisma.auditLog.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.auditLog.update({ where: { id }, data }),
  delete: (id: string) => prisma.auditLog.delete({ where: { id } }),
  list: () => prisma.auditLog.findMany(),
};
