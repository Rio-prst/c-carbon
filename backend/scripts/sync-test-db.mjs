import 'dotenv/config';
import { spawnSync } from 'node:child_process';

const testUrl = process.env.TEST_DATABASE_URL;

if (!testUrl) {
  console.error(
    'TEST_DATABASE_URL is not set in backend/.env.\n' +
      'Create the test database in Supabase (SQL Editor -> CREATE DATABASE c_carbon_test;)\n' +
      'and add TEST_DATABASE_URL to backend/.env. See backend/.env.example.',
  );
  process.exit(1);
}

const result = spawnSync('pnpm', ['exec', 'prisma', 'db', 'push'], {
  env: { ...process.env, DIRECT_URL: testUrl },
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  console.error(
    `Could not sync the Prisma schema to the test database (exit ${result.status ?? 'unknown'}).`,
  );
  process.exit(result.status ?? 1);
}

console.log(`Schema synced to the test database (${testUrl.split('@').pop()}).`);