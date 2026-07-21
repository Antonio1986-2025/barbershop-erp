import { execSync } from 'child_process';
import { existsSync } from 'fs';

const TEST_DB =
  'postgresql://postgres:postgres@localhost:5432/barbershop_erp_test?schema=public';
const CONSENT = 'Sim, pode prosseguir';

module.exports = async () => {
  try {
    execSync(`npx prisma db push --accept-data-loss --url="${TEST_DB}"`, {
      stdio: 'pipe',
      env: {
        ...process.env,
        PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: CONSENT,
      },
    });
    execSync(`npx tsx prisma/seed.ts`, {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: TEST_DB },
    });
  } catch (e) {
    console.error('Setup failed:', e.message);
    throw e;
  }
};
