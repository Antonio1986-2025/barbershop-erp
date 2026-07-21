process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/barbershop_erp_test?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
