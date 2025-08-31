import { prisma } from "@/config/prisma";

export const InvoiceRepository = {
  create: (data: any) => prisma.invoice.create({ data }),
  findById: (id: string) => prisma.invoice.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.invoice.update({ where: { id }, data }),
  delete: (id: string) => prisma.invoice.delete({ where: { id } }),
  list: () => prisma.invoice.findMany(),
};
