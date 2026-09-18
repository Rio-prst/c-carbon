import 'dotenv/config';

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Create the test database in Supabase ' +
      '(SQL Editor -> CREATE DATABASE c_carbon_test;) and add ' +
      'TEST_DATABASE_URL to backend/.env. See backend/.env.example.',
  );
}

// Point the app's PrismaService (which reads DATABASE_URL via ConfigService)
// at the dedicated test database, never the shared/dev one.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
