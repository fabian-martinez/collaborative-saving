// Setup file for e2e tests
// This file runs before all tests and sets up environment variables

// Use DATABASE_TEST_URL if available, otherwise fall back to DATABASE_URL
if (!process.env.DATABASE_TEST_URL && process.env.DATABASE_URL) {
  // If DATABASE_TEST_URL is not set, we can derive it from DATABASE_URL
  // by changing the database name to postgres_test
  const dbUrl = process.env.DATABASE_URL;
  const testDbUrl = dbUrl.replace(/\/[^/]+$/, '/postgres_test');
  process.env.DATABASE_TEST_URL = testDbUrl;
}

// Ensure DATABASE_TEST_URL is set for tests
if (!process.env.DATABASE_TEST_URL) {
  console.warn(
    'WARNING: DATABASE_TEST_URL not set. Tests will use DATABASE_URL. ' +
      'Consider setting DATABASE_TEST_URL to use a separate test database.',
  );
}
