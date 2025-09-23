import { prisma } from "../config/prisma";

export const OtpRepository = {
  create: (data: any) => prisma.otp.create({ data }),
  findById: (id: string) => prisma.otp.findUnique({ where: { id } }),
  findByUserId: (userId: string) => prisma.otp.findUnique({ where: { userId } }),
  update: (id: string, data: any) => prisma.otp.update({ where: { id }, data }),
  updateByUserId: (userId: string, data: any) => prisma.otp.update({ where: { userId }, data }),
  upsertByUserId: (userId: string, data: any) =>
    prisma.otp.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    }),
  delete: (id: string) => prisma.otp.delete({ where: { id } }),
  list: () => prisma.otp.findMany(),
};
