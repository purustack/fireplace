/**
 * Starts an embedded PostgreSQL instance for local development.
 * Prefer Docker (`docker compose up -d`) when available.
 */
import EmbeddedPostgres from "embedded-postgres";
import path from "path";

const port = Number(process.env.PG_PORT ?? 54329);
const databaseDir = path.join(process.cwd(), ".pgdata");

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: "fireplace",
    password: "fireplace",
    port,
    persistent: true,
    onLog: () => undefined,
    onError: (msg) => console.error(msg),
  });

  try {
    await pg.initialise();
  } catch {
    // already initialized
  }

  await pg.start();

  try {
    await pg.createDatabase("fireplace");
  } catch {
    // exists
  }

  console.log(
    `Embedded PostgreSQL ready on port ${port}\nDATABASE_URL=postgresql://fireplace:fireplace@127.0.0.1:${port}/fireplace?schema=public`,
  );

  // Keep process alive
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await pg.stop();
    process.exit(0);
  });

  await new Promise(() => undefined);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
