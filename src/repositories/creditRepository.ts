import { prisma } from "@/config/prisma";

export const CreditRepository = {
  create: (data: any) => prisma.credit.create({ data }),
  findById: (id: string) => prisma.credit.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.credit.update({ where: { id }, data }),
  delete: (id: string) => prisma.credit.delete({ where: { id } }),
  list: () => prisma.credit.findMany(),
};
