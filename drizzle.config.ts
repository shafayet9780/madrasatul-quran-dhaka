import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

// Migrations run over the direct (unpooled) connection.
export default defineConfig({
  schema: './src/lib/survey/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
  strict: true,
});
