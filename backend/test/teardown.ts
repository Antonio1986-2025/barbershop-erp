import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

export default async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  await prisma.$disconnect();
  await pool.end();
};
