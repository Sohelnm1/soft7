import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};


const prismaLogging =
  process.env.NODE_ENV === "production"
    ? ["error", "warn"]
    : ["warn", "error"];

function createPrismaClient() {
  return new PrismaClient({
    log: prismaLogging as any,
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();


if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


if (!process.env.DATABASE_URL) {
  console.warn(
    " DATABASE_URL is missing in environment variables. Prisma may not connect."
  );
}

