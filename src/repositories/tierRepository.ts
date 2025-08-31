import { prisma } from "../config/prisma";

export const TierRepository = {
  create: (data: any) => prisma.tier.create({ data }),
  findById: (id: string) => prisma.tier.findUnique({ where: { id } }),
  findByName: (name: string) => prisma.tier.findUnique({ where: { name } }),
  update: (id: string, data: any) => prisma.tier.update({ where: { id }, data }),
  delete: (id: string) => prisma.tier.delete({ where: { id } }),
  list: () => prisma.tier.findMany({ orderBy: { priceCents: 'asc' } }),
  listPublic: () => prisma.tier.findMany({ where: { isPublic: true }, orderBy: { priceCents: 'asc' } }),
};
