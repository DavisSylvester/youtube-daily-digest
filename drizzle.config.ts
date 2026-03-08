import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/repository/schema.mts',
  out: './src/repository/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/app.db',
  },
});
