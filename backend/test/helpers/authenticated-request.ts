import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { loginAsAdmin } from './auth';

export async function authenticatedRequest(app: INestApplication) {
  const token = await loginAsAdmin(app);
  return request(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`);
}

export function withAuth(agent: request.SuperTest<request.Test>) {
  return agent;
}
