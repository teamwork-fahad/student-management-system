import { PrismaClient } from "@prisma/client";

// Singleton pattern for Vercel serverless environments.
// Without this, each cold-start creates a new PrismaClient which opens new
// DB connections and quickly exhausts Neon's connection limit → 500 errors.
const globalForPrisma = globalThis;

/**
 * Appends `connection_limit=1` to the DATABASE_URL so each Vercel serverless
 * function instance opens at most 1 Postgres connection.  This prevents
 * exhausting Neon's connection pool on concurrent cold-starts.
 */
function buildDbUrl() {
  const base = process.env.DATABASE_URL || "";
  if (!base) return base;
  const separator = base.includes("?") ? "&" : "?";
  // Avoid double-appending if already set
  if (base.includes("connection_limit")) return base;
  return `${base}${separator}connection_limit=1`;
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: buildDbUrl() },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
