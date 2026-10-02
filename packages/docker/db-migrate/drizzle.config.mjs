export default {
  dialect: 'postgresql',
  out: process.env.MIGRATIONS_DIR,
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
