import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  const prisma = app.get(PrismaService);
  const company = await prisma.company.findFirst();
  const user = await prisma.user.findFirst({ where: { companyId: company?.id } });

  if (!user) throw new Error('No admin user found. Run seed first.');

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password: 'admin123' });

  return res.body.accessToken;
}

export async function getAdminCredentials(app: INestApplication) {
  const prisma = app.get(PrismaService);
  const company = await prisma.company.findFirst();
  const user = await prisma.user.findFirst({ where: { companyId: company?.id } });
  return { companyId: company?.id ?? '', userId: user?.id ?? '', email: user?.email ?? '' };
}
