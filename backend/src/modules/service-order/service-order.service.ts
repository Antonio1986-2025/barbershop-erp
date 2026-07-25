import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SaleService } from '../sale/sale.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServiceOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly saleService: SaleService,
  ) {}

  async findAll(companyId: string, filter: {
    unitId?: string;
    customerId?: string;
    professionalId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { companyId, deletedAt: null };

    if (filter.unitId) where.unitId = filter.unitId;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.professionalId) where.professionalId = filter.professionalId;
    if (filter.status) where.status = filter.status;

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          professional: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
          appointment: { select: { id: true, startAt: true, status: true } },
          items: {
            include: {
              service: { select: { id: true, name: true, price: true } },
              product: { select: { id: true, name: true, salePrice: true } },
            },
          },
          sale: { select: { id: true, status: true, total: true } },
          coupon: { select: { id: true, code: true, discountValue: true } },
        },
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        professional: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        appointment: { select: { id: true, startAt: true, status: true } },
        items: {
          include: {
            service: { select: { id: true, name: true, price: true } },
            product: { select: { id: true, name: true, salePrice: true } },
          },
        },
        sale: { select: { id: true, status: true, total: true } },
        coupon: { select: { id: true, code: true, discountValue: true } },
      },
    });

    if (!order) throw new NotFoundException('Ordem de Serviço não encontrada');
    return order;
  }

  async create(companyId: string, userId: string, dto: CreateServiceOrderDto) {
    // RN001: validate no duplicate OS for the same appointment
    if (dto.appointmentId) {
      const existing = await this.prisma.serviceOrder.findFirst({
        where: { appointmentId: dto.appointmentId, deletedAt: null },
      });
      if (existing) {
        throw new BadRequestException('Este agendamento já possui uma Ordem de Serviço');
      }
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Ordem de Serviço deve ter pelo menos um item');
    }

    const itemsData = await this.buildItemsData(companyId, dto.items);

    const subtotal = itemsData.reduce((sum, i) => sum + Number(i.totalPrice), 0);
    const discountTotal = itemsData.reduce((sum, i) => sum + Number(i.discountAmount), 0);
    const total = subtotal - discountTotal;

    const result = await this.prisma.serviceOrder.create({
      data: {
        companyId,
        unitId: dto.unitId,
        customerId: dto.customerId,
        professionalId: dto.professionalId,
        appointmentId: dto.appointmentId,
        notes: dto.notes,
        subtotal,
        total,
        createdBy: userId,
        items: {
          create: itemsData.map((item) => ({
            serviceId: item.serviceId,
            productId: item.productId,
            serviceName: item.serviceName,
            productName: item.productName,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discountAmount: Number(item.discountAmount),
            totalPrice: Number(item.totalPrice),
          })),
        },
      } as any,
      include: {
        customer: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        items: {
          include: {
            service: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE' as any,
      entity: 'serviceOrder',
      entityId: result.id,
      newData: { status: result.status, total: Number(result.total), itemsCount: result.items?.length } as any,
    });

    return result;
  }

  async update(companyId: string, id: string, userId: string, dto: UpdateServiceOrderDto) {
    const order = await this.findOne(companyId, id);

    // RN003: cannot edit if sale linked
    if (order.sale) {
      throw new BadRequestException(
        'Ordem de Serviço não pode ser editada após gerar venda. Utilize cancelamento/estorno.',
      );
    }

    if (order.status === 'CANCELED') {
      throw new BadRequestException('Ordem de Serviço cancelada não pode ser editada');
    }

    let itemsData: any[] | undefined;
    if (dto.items) {
      itemsData = await this.buildItemsData(companyId, dto.items);
    }

    const updateData: any = {};
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.customerId !== undefined) updateData.customerId = dto.customerId;
    if (dto.professionalId !== undefined) updateData.professionalId = dto.professionalId;

    // Recalculate totals if items changed
    if (itemsData) {
      const subtotal = itemsData.reduce((sum, i) => sum + Number(i.totalPrice), 0);
      const discountTotal = itemsData.reduce((sum, i) => sum + Number(i.discountAmount), 0);
      updateData.subtotal = subtotal;
      updateData.total = subtotal - discountTotal;

      updateData.items = {
        deleteMany: {},
        create: itemsData.map((item) => ({
          serviceId: item.serviceId,
          productId: item.productId,
          serviceName: item.serviceName,
          productName: item.productName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount),
          totalPrice: Number(item.totalPrice),
        })),
      };
    }

    const result = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: userId,
      } as any,
      include: {
        customer: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        items: {
          include: {
            service: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
          },
        },
        sale: { select: { id: true, status: true } },
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE' as any,
      entity: 'serviceOrder',
      entityId: id,
      oldData: { status: order.status, notes: order.notes } as any,
      newData: { status: result.status, notes: result.notes } as any,
    });

    return result;
  }

  async generateSale(companyId: string, id: string, userId: string) {
    const order = await this.findOne(companyId, id);

    // RN002: validate no duplicate sale
    if (order.sale) {
      throw new BadRequestException('Esta Ordem de Serviço já possui uma venda vinculada');
    }

    if (order.status === 'CANCELED') {
      throw new BadRequestException('Ordem de Serviço cancelada não pode gerar venda');
    }

    if (!order.items || order.items.length === 0) {
      throw new BadRequestException('Ordem de Serviço sem itens não pode gerar venda');
    }

    // RN005: snapshot values from OS to Sale
    let sale;
    try {
      sale = await this.prisma.sale.create({
        data: {
          companyId,
          unitId: order.unitId,
          customerId: order.customerId,
          serviceOrderId: order.id,
          subtotal: Number(order.subtotal),
          total: Number(order.total),
          notes: order.notes,
          createdBy: userId,
          items: {
            create: order.items.map((item: any) => ({
              productId: item.productId,
              serviceId: item.serviceId,
              productName: item.productName ?? '',
              serviceName: item.serviceName ?? '',
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              discountAmount: Number(item.discountAmount),
              costPrice: Number(item.service?.price ?? item.product?.salePrice ?? 0),
              totalPrice: Number(item.totalPrice),
            })),
          },
        },
        include: {
          unit: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
              service: { select: { id: true, name: true } },
            },
          },
        },
      });
    } catch (e: any) {
      throw new BadRequestException(`Erro ao gerar venda: ${e.message}`);
    }

    await this.auditService.create({
      companyId,
      userId,
      action: 'GENERATE_SALE' as any,
      entity: 'serviceOrder',
      entityId: order.id,
      newData: { saleId: sale.id, total: Number(sale.total) } as any,
    });

    return sale;
  }

  async cancel(companyId: string, id: string, userId: string, reason?: string) {
    const order = await this.findOne(companyId, id);

    if (order.status === 'CANCELED') {
      throw new BadRequestException('Ordem de Serviço já está cancelada');
    }

    if (order.status === 'COMPLETED' && order.sale) {
      throw new BadRequestException(
        'Ordem de Serviço com venda vinculada deve ser estornada pelo financeiro',
      );
    }

    const result = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status: 'CANCELED',
        notes: reason ? `${order.notes ?? ''}\nCancelamento: ${reason}`.trim() : order.notes,
        updatedBy: userId,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CANCEL',
      entity: 'serviceOrder',
      entityId: id,
      oldData: { status: order.status } as any,
      newData: { status: 'CANCELED', reason } as any,
    });

    return result;
  }

  private async buildItemsData(
    companyId: string,
    items: Array<{
      serviceId?: string;
      productId?: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
    }>,
  ) {
    const result: Array<{
      serviceId: string | null;
      productId: string | null;
      serviceName: string | null;
      productName: string | null;
      quantity: Prisma.Decimal;
      unitPrice: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      totalPrice: Prisma.Decimal;
    }> = [];

    for (const item of items) {
      if (!item.serviceId && !item.productId) {
        throw new BadRequestException('Cada item deve ter um serviceId ou productId');
      }

      let serviceName: string | null = null;
      let productName: string | null = null;

      if (item.serviceId) {
        const service = await this.prisma.service.findFirst({
          where: { id: item.serviceId, companyId },
          select: { id: true, name: true },
        });
        if (!service) {
          throw new BadRequestException(`Serviço ${item.serviceId} não encontrado`);
        }
        serviceName = service.name;
      }

      if (item.productId) {
        const product = await this.prisma.product.findFirst({
          where: { id: item.productId, companyId },
          select: { id: true, name: true },
        });
        if (!product) {
          throw new BadRequestException(`Produto ${item.productId} não encontrado`);
        }
        productName = product.name;
      }

      const quantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const discountAmount = new Prisma.Decimal(item.discountAmount ?? 0);
      const totalPrice = quantity.mul(unitPrice).sub(discountAmount);

      result.push({
        serviceId: item.serviceId ?? null,
        productId: item.productId ?? null,
        serviceName,
        productName,
        quantity,
        unitPrice,
        discountAmount,
        totalPrice,
      });
    }

    return result;
  }
}
