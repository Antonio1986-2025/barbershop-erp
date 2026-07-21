import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  const prisma = app.get(PrismaService);
  const company = await prisma.company.findFirst();
  const user = await prisma.user.findFirst({
    where: { companyId: company?.id },
  });

  if (!user) throw new Error('No admin user found. Run seed first.');

  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password: '123456' });

  return res.body.accessToken;
}

export async function getAdminCredentials(app: INestApplication) {
  const prisma = app.get(PrismaService);
  const company = await prisma.company.findFirst();
  const user = await prisma.user.findFirst({
    where: { companyId: company?.id },
  });
  return {
    companyId: company?.id ?? '',
    userId: user?.id ?? '',
    email: user?.email ?? '',
  };
}

export async function loginAsUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  return res.body.accessToken;
}

export async function getAuthToken(
  app: INestApplication,
  email?: string,
  password?: string,
) {
  return loginAsUser(app, email ?? 'admin@demo.com', password ?? '123456');
}
