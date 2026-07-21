import { PrismaService } from '../../src/prisma/prisma.service';

export async function createCompany(
  prisma: PrismaService,
  overrides: any = {},
) {
  const sub = await prisma.subscription.create({
    data: {
      planId: (await prisma.plan.findFirst())!.id,
      status: 'ACTIVE',
      startDate: new Date(),
    },
  });

  return prisma.company.create({
    data: {
      subscriptionId: sub.id,
      corporateName: overrides.corporateName ?? 'Test Company',
      tradeName: overrides.tradeName ?? 'Test',
      document: overrides.document ?? `00${Date.now()}0001`,
      email: overrides.email ?? `company${Date.now()}@test.com`,
      phone: overrides.phone ?? '11999999999',
      status: 'ACTIVE',
    },
  });
}

export async function createUser(
  prisma: PrismaService,
  companyId: string,
  overrides: any = {},
) {
  const role = await prisma.role.findFirst();
  const user = await prisma.user.create({
    data: {
      companyId,
      name: overrides.name ?? 'Admin Test',
      email: overrides.email ?? `admin${Date.now()}@test.com`,
      passwordHash:
        overrides.passwordHash ?? '$argon2id$v=19$m=65536,t=3,p=4$hashed',
      active: true,
    },
  });

  if (role) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: role.id },
    });
  }

  return user;
}

export async function createUnit(
  prisma: PrismaService,
  companyId: string,
  overrides: any = {},
) {
  return prisma.unit.create({
    data: {
      companyId,
      name: overrides.name ?? 'Unidade Teste',
      code: overrides.code ?? `UNT${Date.now()}`,
      status: 'ACTIVE',
    },
  });
}

export async function createCustomer(
  prisma: PrismaService,
  companyId: string,
  overrides: any = {},
) {
  return prisma.customer.create({
    data: {
      companyId,
      name: overrides.name ?? 'Cliente Teste',
      email: overrides.email ?? `cliente${Date.now()}@test.com`,
      phone: overrides.phone ?? '11988888888',
      active: true,
    },
  });
}

export async function createProfessional(
  prisma: PrismaService,
  companyId: string,
  overrides: any = {},
) {
  return prisma.professional.create({
    data: {
      companyId,
      name: overrides.name ?? 'Profissional Teste',
      email: overrides.email ?? `prof${Date.now()}@test.com`,
      phone: overrides.phone ?? '11977777777',
      active: true,
    },
  });
}

export async function createService(
  prisma: PrismaService,
  companyId: string,
  overrides: any = {},
) {
  return prisma.service.create({
    data: {
      companyId,
      name: overrides.name ?? 'Serviço Teste',
      description: overrides.description ?? 'Serviço para testes',
      durationMinutes: overrides.durationMinutes ?? 60,
      price: overrides.price ?? 100,
      active: true,
    },
  });
}

export async function createAppointment(
  prisma: PrismaService,
  companyId: string,
  overrides: any = {},
) {
  const unit = overrides.unit ?? (await createUnit(prisma, companyId));
  const customer =
    overrides.customer ?? (await createCustomer(prisma, companyId));
  const professional =
    overrides.professional ?? (await createProfessional(prisma, companyId));
  const service = overrides.service ?? (await createService(prisma, companyId));
  const startAt = overrides.startAt ?? new Date();

  return prisma.appointment.create({
    data: {
      companyId,
      unitId: unit.id,
      customerId: customer.id,
      professionalId: professional.id,
      serviceId: service.id,
      startAt,
      endAt: new Date(startAt.getTime() + 60 * 60000),
      status: 'SCHEDULED',
    },
  });
}

export async function createFinancialCategory(
  prisma: PrismaService,
  companyId: string,
  overrides: any = {},
) {
  return prisma.financialCategory.create({
    data: {
      companyId,
      name: overrides.name ?? 'Categoria Teste',
      type: overrides.type ?? 'EXPENSE',
      active: true,
    },
  });
}

export async function createFinancialAccount(
  prisma: PrismaService,
  companyId: string,
  overrides: any = {},
) {
  const cat =
    overrides.category ?? (await createFinancialCategory(prisma, companyId));
  return prisma.financialAccount.create({
    data: {
      companyId,
      categoryId: cat.id,
      description: overrides.description ?? 'Conta Teste',
      type: overrides.type ?? 'PAYABLE',
      amount: overrides.amount ?? 1000,
      dueDate: overrides.dueDate ?? new Date(Date.now() + 30 * 86400000),
      status: 'OPEN',
    },
  });
}
