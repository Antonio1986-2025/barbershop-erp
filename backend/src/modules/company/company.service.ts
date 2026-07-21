import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { corporateName: { contains: query.search, mode: 'insensitive' } },
        { tradeName: { contains: query.search, mode: 'insensitive' } },
        { document: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
        include: {
          settings: true,
          subscription: {
            include: { plan: { select: { id: true, name: true, code: true } } },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        settings: true,
        subscription: {
          include: { plan: { select: { id: true, name: true, code: true } } },
        },
      },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return company;
  }

  async create(userId: string, dto: CreateCompanyDto) {
    const existing = await this.prisma.company.findFirst({
      where: { document: dto.document, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Já existe uma empresa com este documento');
    }

    const plan = await this.prisma.plan.findFirst({ where: { active: true } });
    if (!plan) throw new NotFoundException('Nenhum plano ativo encontrado');

    const subscription = await this.prisma.subscription.create({
      data: {
        planId: plan.id,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    });

    const company = await this.prisma.company.create({
      data: {
        ...dto,
        subscriptionId: subscription.id,
        createdBy: userId,
      },
      include: {
        settings: true,
        subscription: {
          include: { plan: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    await this.prisma.companySettings.create({
      data: { companyId: company.id },
    });

    return this.findOne(company.id);
  }

  async update(id: string, userId: string, dto: UpdateCompanyDto) {
    await this.findOne(id);

    if (dto.document) {
      const existing = await this.prisma.company.findFirst({
        where: {
          document: dto.document,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('Já existe outra empresa com este documento');
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
      include: {
        settings: true,
        subscription: {
          include: { plan: { select: { id: true, name: true, code: true } } },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    const [userCount, unitCount] = await Promise.all([
      this.prisma.user.count({ where: { companyId: id, deletedAt: null, active: true } }),
      this.prisma.unit.count({ where: { companyId: id, deletedAt: null, status: 'ACTIVE' } }),
    ]);

    if (userCount > 0 || unitCount > 0) {
      const reasons: string[] = [];
      if (userCount > 0) reasons.push(`${userCount} usuário(s) ativo(s)`);
      if (unitCount > 0) reasons.push(`${unitCount} unidade(s) ativa(s)`);
      throw new ConflictException(
        `A empresa não pode ser desativada porque possui ${reasons.join(' e ')}.`,
      );
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        status: 'INACTIVE',
      },
      select: {
        id: true,
        corporateName: true,
        document: true,
        status: true,
        deletedAt: true,
      },
    });
  }
}
