export default {
  dialect: 'postgresql',
  out: process.env.MIGRATIONS_DIR,
  migrations: {
    table: process.env.MIGRATIONS_TABLE,
  },
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
