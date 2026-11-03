import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function initDatabaseUrl(): string {
  // On Vercel serverless environments, root filesystem is read-only.
  // We copy the database to /tmp so SQLite has read/write permissions for locks and journals.
  if (process.env.VERCEL) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
          try {
            fs.copyFileSync(/*turbopackIgnore: true*/ candidate, tmpDbPath);
            break;
          } catch (e) {
            console.error("Failed to copy SQLite database to /tmp:", e);
          }
        }
      }
    }
    const resolvedUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = resolvedUrl;
    return resolvedUrl;
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

const dbUrl = initDatabaseUrl();

export const db =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db;
}
