const { PrismaClient } = require("@prisma/client");

let prisma;

if (global.__prismaWorker) {
  prisma = global.__prismaWorker;
} else {
  prisma = new PrismaClient({
    log: ["error", "warn"],
  });
  if (process.env.NODE_ENV !== "production") {
    global.__prismaWorker = prisma;
  }
}

module.exports = { prisma };
