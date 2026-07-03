import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

/**
 * Returns a singleton Drizzle client using DATABASE_URL.
 * Sets max connections to 1 to avoid pool exhaustion in serverless environments.
 */
export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    _db = drizzle(sql, { schema });
  }
  return _db;
}

/**
 * Creates a new Drizzle client with the given connection URL.
 * Useful in environments where the URL comes from a binding (e.g. Cloudflare Hyperdrive)
 * rather than an environment variable.
 */
export function createDb(url: string): ReturnType<typeof drizzle<typeof schema>> {
  const sql = postgres(url, { max: 1 });
  return drizzle(sql, { schema });
}
