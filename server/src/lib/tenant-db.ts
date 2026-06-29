import postgres from "postgres";
import { env } from "../env.js";

const appSql = postgres(env.DATABASE_URL_APP, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export async function withTenant<T>(tenantId: string, fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  return appSql.begin(async (txSql) => {
    await txSql`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
    return fn(txSql as unknown as postgres.Sql);
  }) as Promise<T>;
}
