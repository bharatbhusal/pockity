import { prisma } from "@/config/prisma";

export const UserRepository = {
  create: (data: any) => prisma.user.create({ data }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  update: (id: string, data: any) => prisma.user.update({ where: { id }, data }),
  delete: (id: string) => prisma.user.delete({ where: { id } }),
  list: () => prisma.user.findMany(),
};
