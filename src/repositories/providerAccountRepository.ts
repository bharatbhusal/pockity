import { prisma } from "@/config/prisma";

export const ProviderAccountRepository = {
  create: (data: any) => prisma.providerAccount.create({ data }),
  findById: (id: string) => prisma.providerAccount.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.providerAccount.update({ where: { id }, data }),
  delete: (id: string) => prisma.providerAccount.delete({ where: { id } }),
  list: () => prisma.providerAccount.findMany(),
};
