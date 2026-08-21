/** @format */

// =========================================================================
// Prisma Client Singleton (PostgreSQL)
// =========================================================================
// Konsep:
//   - Instance PrismaClient dibuat sekali dan di-reuse.
//   - Prisma 7 mewajibkan adapter (direct DB connection) di constructor.
//   - Response diberi alias `_id` = `id` agar kompatibel dengan format
//     response MongoDB yang sudah dipakai frontend existing.
// =========================================================================

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = require("./var").DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis;

function addMongoIdAlias(value, seen = new Set()) {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (value instanceof Date || value instanceof Buffer) return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((v) => addMongoIdAlias(v, seen));
  }

  const out = { ...value };
  if (typeof out.id === "string" && out._id === undefined) {
    out._id = out.id;
  }
  for (const key of Object.keys(out)) {
    if (out[key] && typeof out[key] === "object") {
      out[key] = addMongoIdAlias(out[key], seen);
    }
  }
  return out;
}

function createPrismaClient() {
  const base = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const result = await query(args);
          return addMongoIdAlias(result);
        },
      },
    },
  });
}

const prisma = globalForPrisma.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    await pool.end();
    console.log("PostgreSQL (Prisma) disconnected");
  } catch (err) {
    console.error("Error disconnecting Prisma:", err.message);
  }
}

process.on("beforeExit", disconnectPrisma);
process.on("SIGINT", async () => {
  await disconnectPrisma();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await disconnectPrisma();
  process.exit(0);
});

module.exports = prisma;
module.exports.prisma = prisma;
module.exports.disconnectPrisma = disconnectPrisma;
module.exports.pool = pool;
