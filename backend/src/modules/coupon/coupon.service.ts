import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';
import { CreateCouponDto, UpdateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(companyId: string) {
    return this.prisma.coupon.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, companyId },
    });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');
    return coupon;
  }

  async findByCode(companyId: string, code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { companyId_code: { companyId, code } },
    });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');
    return coupon;
  }

  async create(companyId: string, userId: string, dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { companyId_code: { companyId, code: dto.code } },
    });

    if (existing) {
      throw new BadRequestException('Código de cupom já existe');
    }

    const result = await this.prisma.coupon.create({
      data: {
        companyId,
        code: dto.code,
        discountType: dto.discountType as any,
        discountValue: dto.discountValue,
        minPurchaseValue: dto.minPurchaseValue,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'Coupon', entityId: result.id,
      newData: { code: dto.code, discountType: dto.discountType, discountValue: dto.discountValue } as any,
    });

    return result;
  }

  async update(companyId: string, id: string, userId: string, dto: UpdateCouponDto) {
    const old = await this.findOne(companyId, id);
    const data: any = { ...dto };
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);

    const result = await this.prisma.coupon.update({
      where: { id },
      data,
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'Coupon', entityId: id,
      oldData: old as any, newData: result as any,
    });

    return result;
  }

  async remove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);
    await this.prisma.coupon.update({
      where: { id },
      data: { active: false },
    });
    await this.auditService.create({
      companyId, userId, action: 'DELETE', entity: 'Coupon', entityId: id,
      oldData: old as any,
    });
  }

  async validate(companyId: string, code: string, saleTotal: number) {
    const coupon = await this.findByCode(companyId, code);

    if (!coupon.active) {
      throw new BadRequestException('Cupom inativo');
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new BadRequestException('Cupom expirado');
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Cupom atingiu o limite de usos');
    }

    if (coupon.minPurchaseValue && saleTotal < Number(coupon.minPurchaseValue)) {
      throw new BadRequestException(
        `Valor mínimo da venda: R$ ${Number(coupon.minPurchaseValue).toFixed(2)}`,
      );
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = saleTotal * (Number(coupon.discountValue) / 100);
    } else {
      discount = Number(coupon.discountValue);
    }

    if (discount > saleTotal) {
      discount = saleTotal;
    }

    return { coupon, discount: Math.round(discount * 100) / 100 };
  }

  async apply(companyId: string, code: string, saleId: string, userId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, companyId },
    });

    if (!sale) throw new NotFoundException('Venda não encontrada');

    const { coupon, discount } = await this.validate(companyId, code, Number(sale.total));

    const newTotal = Number(sale.total) - discount;

    await this.prisma.sale.update({
      where: { id: saleId },
      data: {
        discountAmount: new Prisma.Decimal(discount),
        total: new Prisma.Decimal(newTotal),
      },
    });

    await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'sale', entityId: saleId,
      newData: { coupon: coupon.code, discount } as any,
    });

    return { coupon: coupon.code, discount, newTotal: Math.round(newTotal * 100) / 100 };
  }
}
