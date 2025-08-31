import { prisma } from "@/config/prisma";

export const PaymentTransactionRepository = {
  create: (data: any) => prisma.paymentTransaction.create({ data }),
  findById: (id: string) => prisma.paymentTransaction.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.paymentTransaction.update({ where: { id }, data }),
  delete: (id: string) => prisma.paymentTransaction.delete({ where: { id } }),
  list: () => prisma.paymentTransaction.findMany(),
};
