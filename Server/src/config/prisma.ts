import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

// Save instance globally in dev (avoid multiple connections on hot reloads)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Gracefully disconnect Prisma on process shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
