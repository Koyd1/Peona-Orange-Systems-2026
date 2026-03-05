import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function resolveDatabaseUrl(): string {
  const directUrl = process.env.DATABASE_URL?.trim();
  if (directUrl) {
    return directUrl;
  }

  const asyncUrl = process.env.DATABASE_URL_ASYNC?.trim();
  if (asyncUrl) {
    return asyncUrl.replace(/^postgresql\+asyncpg:\/\//, "postgresql://");
  }

  throw new Error(
    "DATABASE_URL is not configured. Set DATABASE_URL (or DATABASE_URL_ASYNC) in environment variables."
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl()
      }
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
