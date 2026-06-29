import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "..", "drizzle");

function checksum(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgres://bookia:bookia_pass@localhost:5432/bookia";
  const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10 });

  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "bookia_migrations" (
        "filename" text PRIMARY KEY NOT NULL,
        "checksum" text NOT NULL,
        "applied_at" timestamptz DEFAULT NOW() NOT NULL
      );
    `);

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("ℹ️  No .sql files found in", migrationsDir);
      return;
    }

    const baseline = process.env.MIGRATIONS_BASELINE === "true";

    if (baseline) {
      console.log(
        "📐 MIGRATIONS_BASELINE=true — registering all SQL files as applied without executing"
      );
      for (const file of files) {
        const content = readFileSync(join(migrationsDir, file), "utf8");
        const cs = checksum(content);
        await sql`
          INSERT INTO "bookia_migrations" ("filename", "checksum")
          VALUES (${file}, ${cs})
          ON CONFLICT ("filename") DO NOTHING
        `;
      }
      console.log(`✅ Baseline complete: ${files.length} files registered`);
      return;
    }

    const applied = await sql`SELECT filename FROM "bookia_migrations"`;
    const appliedSet = new Set(applied.map((r) => r.filename as string));

    let already = 0;
    let executed = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        already++;
        continue;
      }
      const content = readFileSync(join(migrationsDir, file), "utf8");
      const cs = checksum(content);
      console.log(`⚡ Applying ${file}...`);

      const statements = content.split("--> statement-breakpoint");
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;
        await sql.unsafe(trimmed);
      }

      await sql`
        INSERT INTO "bookia_migrations" ("filename", "checksum")
        VALUES (${file}, ${cs})
      `;
      executed++;
    }

    console.log(
      `✅ Migrations complete: ${executed} applied, ${already} already applied, ${files.length} total`
    );
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
