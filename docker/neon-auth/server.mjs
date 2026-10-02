import { createServer } from 'node:http';
import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { toNodeHandler } from 'better-auth/node';
import pg from 'pg';

const auth = betterAuth({
  database: new pg.Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: '/neondb/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? '').split(',').filter(Boolean),
  emailAndPassword: { enabled: true },
  advanced: { disableCSRFCheck: true },
});

const { runMigrations } = await getMigrations(auth.options);
await runMigrations();

createServer(toNodeHandler(auth)).listen(3010, () => {
  console.log('Neon Auth stand-in listening on http://localhost:3010/neondb/auth');
});
