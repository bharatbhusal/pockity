import { prisma } from "../config/prisma";

export const ApiKeyRepository = {
  create: (data: any) => prisma.apiKey.create({ data }),
  findById: (id: string) => prisma.apiKey.findUnique({ where: { id } }),
  findByAccessKey: (apiAccessKeyId: string) => prisma.apiKey.findUnique({ where: { accessKeyId: apiAccessKeyId } }),
  findByUserId: (userId: string) => prisma.apiKey.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  update: (id: string, data: any) => prisma.apiKey.update({ where: { id }, data }),
  delete: (id: string) => prisma.apiKey.delete({ where: { id } }),
  list: () => prisma.apiKey.findMany(),
};
