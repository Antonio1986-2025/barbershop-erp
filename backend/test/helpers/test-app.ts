import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.init();
  return app;
}

export async function cleanupDatabase(prisma: PrismaService) {
  const tables = ['notifications', 'financial_accounts', 'financial_categories', 'cash_closings',
    'schedule_blocks', 'business_hours', 'audit_logs', 'refresh_tokens',
    'appointments', 'service_order_items', 'service_orders', 'payments',
    'cash_transactions', 'cash_registers', 'stock_movements', 'stocks',
    'products', 'categories', 'professional_units', 'professionals',
    'customers', 'user_roles', 'role_permissions', 'permissions', 'roles',
    'users', 'company_settings', 'units', 'companies', 'subscriptions',
    'plan_prices', 'plan_features', 'features', 'plans'];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch {
      // table may not exist
    }
  }
}
