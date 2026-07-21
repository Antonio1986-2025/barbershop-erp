import 'dotenv/config';
import { execSync } from 'child_process';

process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/barbershop_erp_test?schema=public';
process.env.JWT_SECRET ||= 'test-jwt-secret';
process.env.JWT_EXPIRES_IN ||= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ||= '7d';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'pipe', env: { ...process.env } });
    execSync('npx prisma db seed', { stdio: 'pipe', env: { ...process.env } });
  } catch (e) {
    // migrations may already be applied
  }
});
