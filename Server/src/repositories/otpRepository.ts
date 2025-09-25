import { OtpPurpose } from "@prisma/client";
import { prisma } from "../config/prisma";

export const OtpRepository = {
  create: (data: any) => prisma.otp.create({ data }),
  findById: (id: string) => prisma.otp.findUnique({ where: { id } }),
  findByEmail: (email: string) => prisma.otp.findUnique({ where: { email } }),
  findByEmailAndPurpose: (email: string, purpose: OtpPurpose) => prisma.otp.findUnique({ where: { email, purpose } }),
  update: (id: string, data: any) => prisma.otp.update({ where: { id }, data }),
  updateByEmail: (email: string, data: any) => prisma.otp.update({ where: { email }, data }),
  upsertByEmail: (email: string, data: any) =>
    prisma.otp.upsert({
      where: { email },
      update: data,
      create: { ...data, email },
    }),
  delete: (id: string) => prisma.otp.delete({ where: { id } }),
  list: () => prisma.otp.findMany(),
};
