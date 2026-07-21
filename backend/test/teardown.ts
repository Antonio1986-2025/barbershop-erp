import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const TEST_DB =
  'postgresql://postgres:postgres@localhost:5432/barbershop_erp_test?schema=public';

export default async () => {
  const pool = new pg.Pool({ connectionString: TEST_DB });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$executeRawUnsafe(
    'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;',
  );
  await prisma.$disconnect();
  await pool.end();
};
