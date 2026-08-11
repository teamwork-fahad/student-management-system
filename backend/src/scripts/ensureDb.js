import prisma from "../config/prisma.js";
import { ensureDbSchema } from "../config/ensureDbSchema.js";

async function main() {
  console.log("Running DB Schema Sync Script...");
  await ensureDbSchema();
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error syncing DB schema:", err);
  process.exit(1);
});
