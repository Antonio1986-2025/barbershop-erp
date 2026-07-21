import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as argon2 from 'argon2';

async function seed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  const hash = await argon2.hash('123456');

  const plan = await prisma.plan.upsert({
    where: { code: 'basic' },
    update: {},
    create: { code: 'basic', name: 'Básico' },
  });

  const subscription = await prisma.subscription.create({
    data: { planId: plan.id, status: 'ACTIVE', startDate: new Date() },
  });

  const company = await prisma.company.upsert({
    where: { document: '00000000000191' },
    update: {},
    create: {
      subscriptionId: subscription.id,
      corporateName: 'Barbearia Demo',
      tradeName: 'Demo Barbershop',
      document: '00000000000191',
      email: 'demo@barbershop.com',
    },
  });

  const role = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: { name: 'Administrador', slug: 'admin' },
  });

  const userRecord = await prisma.user.findFirst({
    where: { email: 'admin@demo.com', companyId: company.id },
  });

  let userId: string;

  if (userRecord) {
    await prisma.user.update({
      where: { id: userRecord.id },
      data: { passwordHash: hash },
    });
    userId = userRecord.id;
  } else {
    const newUser = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Admin',
        email: 'admin@demo.com',
        passwordHash: hash,
      },
    });
    userId = newUser.id;
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });

  console.log('Seed concluído');
  console.log({ email: 'admin@demo.com', password: '123456' });

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
