"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
const prismaLogging = process.env.NODE_ENV === "production"
    ? ["error", "warn"]
    : ["warn", "error"];
function createPrismaClient() {
    return new client_1.PrismaClient({
        log: prismaLogging,
    });
}
exports.prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
if (!process.env.DATABASE_URL) {
    console.warn(" DATABASE_URL is missing in environment variables. Prisma may not connect.");
}
