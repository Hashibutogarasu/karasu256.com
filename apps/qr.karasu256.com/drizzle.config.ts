import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: '../../packages/db/src/schema/qr-generations.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
