import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Direct/session connection used by Prisma CLI (generate + migrations).
    // Must NOT point at the transaction-mode pooler (port 6543): Prisma
    // Migrate needs a single-connection, non-pooled session to the database.
    // The fallback only matters for `prisma generate` on a fresh clone before
    // .env exists (generate never contacts the database). Real migrations
    // require DIRECT_URL to be set.
    url:
      process.env.DIRECT_URL ??
      'postgres://postgres:postgres@localhost:5432/c-carbon',
  },
});
