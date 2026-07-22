import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findAllSimple(companyId: string) {
    return this.cache.getOrSet(`units:simple:${companyId}`, () =>
      this.prisma.unit.findMany({
        where: { companyId, deletedAt: null, status: 'ACTIVE' },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
    );
  }

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      orderBy?: string;
      orderDir?: 'asc' | 'desc';
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId, deletedAt: null };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      this.prisma.unit.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    return this.cache.getOrSet(`unit:${companyId}:${id}`, async () => {
      const unit = await this.prisma.unit.findFirst({
        where: { id, companyId, deletedAt: null },
      });
      if (!unit) throw new NotFoundException('Unidade não encontrada');
      return unit;
    });
  }

  async create(companyId: string, userId: string, dto: CreateUnitDto) {
    const existing = await this.prisma.unit.findFirst({
      where: { companyId, code: dto.code, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Já existe uma unidade com este código');
    }

    this.cache.delByPrefix(`units:${companyId}`);

    return this.prisma.unit.create({
      data: { ...dto, companyId, createdBy: userId },
    });
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateUnitDto,
  ) {
    await this.findOne(companyId, id);

    if (dto.code) {
      const existing = await this.prisma.unit.findFirst({
        where: {
          companyId,
          code: dto.code,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('Já existe outra unidade com este código');
      }
    }

    this.cache.delByPrefix(`units:${companyId}`);
    this.cache.del(`unit:${companyId}:${id}`);

    return this.prisma.unit.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
  }

  async remove(companyId: string, id: string, userId: string) {
    await this.findOne(companyId, id);

    const [profCount, apptCount, cashCount, stockCount] = await Promise.all([
      this.prisma.professionalUnit.count({ where: { unitId: id } }),
      this.prisma.appointment.count({ where: { unitId: id, deletedAt: null } }),
      this.prisma.cashRegister.count({ where: { unitId: id, status: 'OPEN' } }),
      this.prisma.stock.count({ where: { unitId: id, quantity: { gt: 0 } } }),
    ]);

    if (profCount > 0 || apptCount > 0 || cashCount > 0 || stockCount > 0) {
      const reasons: string[] = [];
      if (profCount > 0) reasons.push('profissionais vinculados');
      if (apptCount > 0) reasons.push('atendimentos');
      if (cashCount > 0) reasons.push('caixas abertos');
      if (stockCount > 0) reasons.push('estoque ativo');
      throw new ConflictException(
        `A unidade não pode ser excluída porque possui ${reasons.join(', ')}.`,
      );
    }

    this.cache.delByPrefix(`units:${companyId}`);
    this.cache.del(`unit:${companyId}:${id}`);

    return this.prisma.unit.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
