import 'reflect-metadata';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { PhoneService } from '../src/modules/customer/phone.service';

async function seed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  console.log('🌱 Iniciando seed...');

  const hash = await argon2.hash('123456');

  // ── Plan ──
  const plan = await prisma.plan.upsert({
    where: { code: 'basic' },
    update: {},
    create: { code: 'basic', name: 'Básico' },
  });

  // ── Subscription ──
  const subscription = await prisma.subscription.create({
    data: { planId: plan.id, status: 'ACTIVE', startDate: new Date() },
  });

  // ── Company ──
  const company = await prisma.company.upsert({
    where: { document: '00000000000191' },
    update: {},
    create: {
      subscriptionId: subscription.id,
      corporateName: 'Barbearia Demo',
      tradeName: 'Demo Barbershop',
      document: '00000000000191',
      email: 'demo@barbershop.com',
      phone: '(11) 99999-9999',
    },
  });

  // ── Units ──
  const unitMatriz = await prisma.unit.upsert({
    where: { companyId_code: { companyId: company.id, code: 'MATRIZ' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Matriz',
      code: 'MATRIZ',
      phone: '(11) 3000-0000',
      email: 'matriz@demo.com',
      city: 'São Paulo',
      state: 'SP',
    },
  });

  const unitFilial = await prisma.unit.upsert({
    where: { companyId_code: { companyId: company.id, code: 'FILIAL' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Filial Centro',
      code: 'FILIAL',
      phone: '(11) 3000-0001',
      city: 'São Paulo',
      state: 'SP',
    },
  });

  // ── Role ──
  const roleAdmin = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: { name: 'Administrador', slug: 'admin' },
  });
  const roleOperator = await prisma.role.upsert({
    where: { slug: 'operator' },
    update: {},
    create: { name: 'Operador', slug: 'operator' },
  });
  const roleViewer = await prisma.role.upsert({
    where: { slug: 'viewer' },
    update: {},
    create: { name: 'Visualização', slug: 'viewer' },
  });
  const roleBarber = await prisma.role.upsert({
    where: { slug: 'barber' },
    update: {},
    create: { name: 'Barbeiro', slug: 'barber' },
  });

  // ── Permissions ──
  const allPerms = [
    'users.view', 'users.create', 'users.update', 'users.delete',
    'companies.view', 'companies.create', 'companies.update', 'companies.delete',
    'audit.view', 'company_settings.view', 'company_settings.update',
    'schedule.view', 'schedule.create', 'schedule.update', 'schedule.delete',
    'notifications.view', 'notifications.create', 'notifications.update',
    'financial.view', 'financial.create', 'financial.update', 'financial.delete', 'financial.close_cash',
    'dashboard.view', 'dashboard.analytics',
    'stock.view', 'stock.create', 'stock.update', 'stock.delete',
    'products.view', 'products.create', 'products.update', 'products.delete',
    'customers.view', 'customers.create', 'customers.update', 'customers.delete',
    'sales.view', 'sales.create', 'sales.update', 'sales.delete',
    'crm.view', 'crm.create', 'crm.update', 'crm.delete',
  ];

  // BARBER only gets view permissions for their domain
  const barberPerms = [
    'dashboard.view',
    'schedule.view', 'schedule.create', 'schedule.update',
    'customers.view', 'customers.create',
    'sales.view', 'sales.create',
    'crm.view',
    'notifications.view',
  ];

  for (const slug of allPerms) {
    const perm = await prisma.permission.upsert({
      where: { slug },
      update: {},
      create: { name: slug.replace('.', ' '), slug, module: slug.split('.')[0] },
    });
    for (const role of [roleAdmin, roleOperator]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      }).catch(() => {});
    }
    // BARBER gets specific permissions
    if (barberPerms.includes(slug)) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleBarber.id, permissionId: perm.id } },
        update: {},
        create: { roleId: roleBarber.id, permissionId: perm.id },
      }).catch(() => {});
    }
    if (slug.endsWith('.view')) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleViewer.id, permissionId: perm.id } },
        update: {},
        create: { roleId: roleViewer.id, permissionId: perm.id },
      }).catch(() => {});
    }
  }

  // ── Users ──
  async function createUser(name: string, email: string, roleId: string) {
    const existing = await prisma.user.findFirst({ where: { email, companyId: company.id } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash: hash } });
      return existing.id;
    }
    const user = await prisma.user.create({
      data: { companyId: company.id, name, email, passwordHash: hash },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {}, create: { userId: user.id, roleId },
    });
    return user.id;
  }

  const adminId = await createUser('Admin', 'admin@demo.com', roleAdmin.id);
  const operId = await createUser('Operador', 'operador@demo.com', roleOperator.id);
  await createUser('Visualizador', 'visualizador@demo.com', roleViewer.id);
  const barberUserId = await createUser('Barbeiro', 'barber@demo.com', roleBarber.id);

  // ── Business Hours (Matriz) ──
  for (const day of [1, 2, 3, 4, 5, 6]) {
    const end = day === 6 ? '13:00' : '18:00';
    const existing = await prisma.businessHour.findFirst({
      where: { companyId: company.id, unitId: unitMatriz.id, dayOfWeek: day, startTime: '08:00' },
    });
    if (!existing) {
      await prisma.businessHour.create({
        data: { companyId: company.id, unitId: unitMatriz.id, dayOfWeek: day, startTime: '08:00', endTime: end, active: true },
      });
    }
  }

  // ── Categories ──
  const catPomadas = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Pomadas' } },
    update: {}, create: { companyId: company.id, name: 'Pomadas' },
  });
  const catShampoos = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Shampoos' } },
    update: {}, create: { companyId: company.id, name: 'Shampoos' },
  });
  const catBebidas = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Bebidas' } },
    update: {}, create: { companyId: company.id, name: 'Bebidas' },
  });
  const catCosmeticos = await prisma.category.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Cosméticos' } },
    update: {}, create: { companyId: company.id, name: 'Cosméticos' },
  });

  // ── Products ──
  const productsData = [
    { name: 'Pomada Modeladora 100g', barcode: '78910001', costPrice: 18.50, salePrice: 39.90, categoryId: catPomadas.id },
    { name: 'Pomada Matte 80g', barcode: '78910002', costPrice: 22.00, salePrice: 44.90, categoryId: catPomadas.id },
    { name: 'Shampoo Antiqueda 200ml', barcode: '78910003', costPrice: 15.00, salePrice: 35.00, categoryId: catShampoos.id },
    { name: 'Shampoo Matizador 200ml', barcode: '78910004', costPrice: 28.00, salePrice: 55.00, categoryId: catShampoos.id },
    { name: 'Condicionador 200ml', barcode: '78910005', costPrice: 12.00, salePrice: 29.90, categoryId: catShampoos.id },
    { name: 'Cerveja Long Neck', barcode: '78910006', costPrice: 4.00, salePrice: 8.00, categoryId: catBebidas.id },
    { name: 'Refrigerante Lata', barcode: '78910007', costPrice: 3.50, salePrice: 6.00, categoryId: catBebidas.id },
    { name: 'Água Mineral 500ml', barcode: '78910008', costPrice: 1.50, salePrice: 3.00, categoryId: catBebidas.id },
    { name: 'Óleo Capilar 30ml', barcode: '78910009', costPrice: 25.00, salePrice: 49.90, categoryId: catCosmeticos.id },
    { name: 'Finalizador 150ml', barcode: '78910010', costPrice: 20.00, salePrice: 42.00, categoryId: catCosmeticos.id },
  ];

  const productIds: string[] = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { companyId_barcode: { companyId: company.id, barcode: p.barcode! } },
      update: {},
      create: { ...p, companyId: company.id },
    });
    productIds.push(product.id);

    await prisma.stock.upsert({
      where: { companyId_unitId_productId: { companyId: company.id, unitId: unitMatriz.id, productId: product.id } },
      update: {},
      create: { companyId: company.id, unitId: unitMatriz.id, productId: product.id, quantity: 50, avgCost: p.costPrice, minStock: 5 },
    });
    await prisma.stock.upsert({
      where: { companyId_unitId_productId: { companyId: company.id, unitId: unitFilial.id, productId: product.id } },
      update: {},
      create: { companyId: company.id, unitId: unitFilial.id, productId: product.id, quantity: 20, avgCost: p.costPrice, minStock: 3 },
    });
  }

  // ── Services ──
  const servicesData = [
    { name: 'Corte Masculino', durationMinutes: 30, price: 50 },
    { name: 'Barba', durationMinutes: 20, price: 30 },
    { name: 'Corte + Barba', durationMinutes: 45, price: 70 },
    { name: 'Hidratação Capilar', durationMinutes: 40, price: 80 },
    { name: 'Sobrancelha', durationMinutes: 15, price: 25 },
    { name: 'Pigmentação Capilar', durationMinutes: 60, price: 120 },
  ];
  for (const svc of servicesData) {
    await prisma.service.create({
      data: { ...svc, companyId: company.id, commissionType: 'PERCENTAGE', commissionValue: 40 },
    }).catch(() => {});
  }

  // ── Professionals ──
  const profsData = [
    { name: 'Carlos Silva', email: 'carlos@demo.com', phone: '(11) 91111-0001' },
    { name: 'Ana Oliveira', email: 'ana@demo.com', phone: '(11) 91111-0002' },
    { name: 'Pedro Santos', email: 'pedro@demo.com', phone: '(11) 91111-0003' },
  ];
  for (const prof of profsData) {
    const p = await prisma.professional.upsert({
      where: { companyId_document: { companyId: company.id, document: prof.email } },
      update: {},
      create: { ...prof, document: prof.email, companyId: company.id, commissionRate: 40 },
    });
    await prisma.professionalUnit.upsert({
      where: { professionalId_unitId: { professionalId: p.id, unitId: unitMatriz.id } },
      update: {}, create: { professionalId: p.id, unitId: unitMatriz.id },
    });
  }

  // Link barber user to Pedro Santos professional
  const pedroProf = await prisma.professional.findFirst({
    where: { companyId: company.id, email: 'pedro@demo.com' },
  });
  if (pedroProf && barberUserId) {
    await prisma.user.update({
      where: { id: barberUserId },
      data: { professionalId: pedroProf.id },
    });
    await prisma.professional.update({
      where: { id: pedroProf.id },
      data: { userId: barberUserId },
    });
  }

  // ── Customers ──
  const phoneService = new PhoneService();

  const customersData = [
    { name: 'João Pereira', email: 'joao@email.com', phone: '(11) 92222-0001', birthDate: new Date('1990-05-15') },
    { name: 'Maria Lima', email: 'maria@email.com', phone: '(11) 92222-0002', birthDate: new Date('1988-12-20') },
    { name: 'Lucas Costa', email: 'lucas@email.com', phone: '(11) 92222-0003', birthDate: new Date('1995-08-10') },
    { name: 'Fernanda Souza', email: 'fernanda@email.com', phone: '(11) 92222-0004' },
    { name: 'Rafael Oliveira', email: 'rafael@email.com', phone: '(11) 92222-0005' },
  ];
  for (const c of customersData) {
    const normalized = phoneService.normalize(c.phone);
    // Buscar por email (document) para idempotência com seed anterior
    // ou por telefone normalizado (regra atual)
    const existing = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        OR: [
          { document: c.email },
          { phoneNormalized: normalized },
        ],
        deletedAt: null,
      },
    });
    if (!existing) {
      await prisma.customer.create({
        data: {
          name: c.name,
          email: c.email,
          phone: phoneService.format(c.phone),
          phoneNormalized: normalized,
          document: c.email,
          birthDate: c.birthDate,
          companyId: company.id,
        },
      });
      console.log(`  Cliente criado: ${c.name}`);
    } else if (!existing.phoneNormalized) {
      // Atualizar cliente existente com phoneNormalized
      await prisma.customer.update({
        where: { id: existing.id },
        data: {
          phone: phoneService.format(c.phone),
          phoneNormalized: normalized,
        },
      });
      console.log(`  Cliente atualizado: ${existing.name} — phoneNormalized preenchido`);
    } else {
      console.log(`  Cliente já existe: ${existing.name}`);
    }
  }

  // ── Suppliers ──
  const suppliersData = [
    { name: 'Distribuidora de Produtos Ltda', email: 'contato@distribuidora.com', phone: '(11) 3333-0001', document: '11111111000111' },
    { name: 'Cosméticos Premium SA', email: 'vendas@cosmeticospremium.com', phone: '(11) 3333-0002', document: '22222222000122' },
  ];
  for (const s of suppliersData) {
    await prisma.supplier.upsert({
      where: { companyId_document: { companyId: company.id, document: s.document } },
      update: {},
      create: { ...s, companyId: company.id },
    });
  }

  // ── Purchases ──
  const supplier1 = await prisma.supplier.findFirst({ where: { companyId: company.id } });
  if (supplier1) {
    await prisma.purchase.create({
      data: {
        companyId: company.id, supplierId: supplier1.id, unitId: unitMatriz.id,
        status: 'CONFIRMED', totalAmount: 350, createdBy: adminId,
        invoiceNumber: 'NF-0001',
        items: {
          create: [
            { productId: productIds[0], quantity: 10, unitCost: 18.50, totalCost: 185 },
            { productId: productIds[2], quantity: 10, unitCost: 15.00, totalCost: 150 },
          ],
        },
      },
    });
  }

  // ── Loyalty Program ──
  const loyaltyExisting = await prisma.loyaltyProgram.findUnique({ where: { companyId: company.id } });
  if (!loyaltyExisting) {
    await prisma.loyaltyProgram.create({
      data: { companyId: company.id, name: 'Programa de Fidelidade', pointsPerAmount: 10, minAmount: 0 },
    });
  }

  // ── Financial Categories ──
  await prisma.financialCategory.upsert({
    where: { companyId_name_type: { companyId: company.id, name: 'Vendas', type: 'INCOME' } },
    update: {},
    create: { companyId: company.id, name: 'Vendas', type: 'INCOME' },
  });

  // ── CRM Segments ──
  const vipRules = JSON.stringify([{ field: 'totalSpent', operator: 'gte', value: 500 }]);
  await prisma.customerSegment.upsert({
    where: { companyId_name: { companyId: company.id, name: 'VIP' } },
    update: {},
    create: { companyId: company.id, name: 'VIP', rules: vipRules, color: '#gold' },
  });
  const activeRules = JSON.stringify([{ field: 'totalPurchases', operator: 'gte', value: 1 }]);
  await prisma.customerSegment.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Ativo' } },
    update: {},
    create: { companyId: company.id, name: 'Ativo', rules: activeRules, color: '#green' },
  });

  // ── Coupons ──
  await prisma.coupon.create({
    data: { companyId: company.id, code: 'BEMVINDO10', discountType: 'PERCENTAGE', discountValue: 10, minPurchaseValue: 30, maxUses: 100 },
  }).catch(() => {});
  await prisma.coupon.create({
    data: { companyId: company.id, code: 'PRIMEIRACORTE', discountType: 'FIXED', discountValue: 15, maxUses: 50 },
  }).catch(() => {});

  // ── Barber Demo Data (Pedro Santos) ──
  const pedro = await prisma.professional.findFirst({ where: { email: 'pedro@demo.com' } });
  const servCorte = await prisma.service.findFirst({ where: { companyId: company.id, name: { contains: 'Corte' } } });
  const servBarba = await prisma.service.findFirst({ where: { companyId: company.id, name: { contains: 'Barba' } } });
  const servCorteBarba = await prisma.service.findFirst({ where: { companyId: company.id, name: { contains: 'Corte + Barba' } } });
  const servHidratacao = await prisma.service.findFirst({ where: { companyId: company.id, name: { contains: 'Hidratação' } } });
  const servPigmentacao = await prisma.service.findFirst({ where: { companyId: company.id, name: { contains: 'Pigmentação' } } });
  const pedroCustomers = await prisma.customer.findMany({ where: { companyId: company.id }, take: 4 });

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (pedro && pedroCustomers.length >= 2) {
    // Past appointments (completed)
    const pastDates = [
      new Date(year, month, day - 3, 9, 0),
      new Date(year, month, day - 3, 10, 0),
      new Date(year, month, day - 2, 14, 0),
      new Date(year, month, day - 1, 8, 30),
      new Date(year, month, day - 1, 11, 0),
      new Date(year, month, day - 1, 15, 0),
    ];
    const pastServices = [servCorte, servBarba, servCorteBarba, servHidratacao, servCorte, servPigmentacao];
    const pastPrices = [50, 30, 70, 80, 50, 120];

    for (let i = 0; i < pastDates.length; i++) {
      const service = pastServices[i] || servCorte;
      const price = pastPrices[i] || 50;
      const customer = pedroCustomers[i % pedroCustomers.length];
      const endAt = new Date(pastDates[i].getTime() + 60 * 60000);

      // Create appointment as COMPLETED
      const apt = await prisma.appointment.create({
        data: {
          companyId: company.id,
          unitId: unitMatriz.id,
          customerId: customer.id,
          professionalId: pedro.id,
          serviceId: service?.id ?? servCorte?.id ?? '',
          startAt: pastDates[i],
          endAt,
          status: 'COMPLETED',
          createdBy: barberUserId,
        },
      }).catch(() => null);
      if (!apt) continue;

      // Create service order
      const so = await prisma.serviceOrder.create({
        data: {
          companyId: company.id,
          unitId: unitMatriz.id,
          customerId: customer.id,
          professionalId: pedro.id,
          status: 'COMPLETED',
          subtotal: price,
          discount: 0,
          total: price,
          startedAt: pastDates[i],
          finishedAt: endAt,
          createdBy: barberUserId,
        },
      }).catch(() => null);
      if (!so) continue;

      // Add service order item
      await prisma.serviceOrderItem.create({
        data: {
          serviceOrderId: so.id,
          serviceId: service?.id ?? servCorte?.id ?? '',
          quantity: 1,
          unitPrice: price,
          totalPrice: price,
        },
      }).catch(() => {});

      // Create sale
      const sale = await prisma.sale.create({
        data: {
          companyId: company.id,
          unitId: unitMatriz.id,
          customerId: customer.id,
          serviceOrderId: so.id,
          status: 'PAID',
          subtotal: price,
          discountAmount: 0,
          total: price,
          createdBy: barberUserId,
        },
      }).catch(() => null);
      if (!sale) continue;

      // Payment
      await prisma.payment.create({
        data: {
          companyId: company.id,
          unitId: unitMatriz.id,
          serviceOrderId: so.id,
          saleId: sale.id,
          amount: price,
          paymentMethod: 'CASH',
          status: 'PAID',
          paidAt: pastDates[i],
        },
      }).catch(() => {});
    }

    // Today's appointments (scheduled)
    const todaySlots = [
      new Date(year, month, day, 9, 0),
      new Date(year, month, day, 10, 0),
      new Date(year, month, day, 11, 0),
      new Date(year, month, day, 14, 0),
      new Date(year, month, day, 15, 30),
    ];
    const todayServices = [servCorte, servBarba, servCorteBarba, servHidratacao, servCorte];

    for (let i = 0; i < todaySlots.length; i++) {
      const svc = todayServices[i] || servCorte;
      const customerIdx = (i + 2) % pedroCustomers.length;
      if (i < pedroCustomers.length) {
        await prisma.appointment.create({
          data: {
            companyId: company.id,
            unitId: unitMatriz.id,
            customerId: pedroCustomers[customerIdx].id,
            professionalId: pedro.id,
            serviceId: svc?.id ?? servCorte?.id ?? '',
            startAt: todaySlots[i],
            endAt: new Date(todaySlots[i].getTime() + 60 * 60000),
            status: i < 2 ? 'SCHEDULED' : i < 4 ? 'CONFIRMED' : 'SCHEDULED',
            createdBy: barberUserId,
          },
        }).catch(() => {});
      }
    }
  }

  console.log('');
  console.log('📧 admin@demo.com / 123456  (admin)');
  console.log('📧 operador@demo.com / 123456');
  console.log('📧 visualizador@demo.com / 123456');
  console.log('');

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('❌ Seed falhou:', e);
  process.exit(1);
});
