import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PhoneService } from './phone.service';
import { InteractionService } from '../interaction/interaction.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly phoneService: PhoneService,
    private readonly interactionService: InteractionService,
  ) {}

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      phone?: string;
      active?: string;
      orderBy?: string;
      orderDir?: 'asc' | 'desc';
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId, deletedAt: null };

    if (query.active !== undefined && query.active !== '') {
      where.active = query.active === 'true';
    }

    if (query.phone) {
      // Busca por telefone normalizado
      const norm = this.phoneService.normalize(query.phone);
      where.phoneNormalized = norm;
    } else if (query.search) {
      const s = query.search;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
        { phoneNormalized: { contains: s, mode: 'insensitive' } },
        { document: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderField = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Busca um cliente ativo pelo telefone normalizado na empresa.
   * Usado pelo fluxo telefone-primeiro.
   */
  async findByPhone(companyId: string, phone: string) {
    const norm = this.phoneService.normalize(phone);
    if (!norm) throw new BadRequestException('Telefone inválido');

    const customer = await this.prisma.customer.findFirst({
      where: { companyId, phoneNormalized: norm, deletedAt: null, active: true },
    });
    return customer;
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async create(companyId: string, userId: string, dto: CreateCustomerDto) {
    // Normalizar telefone
    const normalizedPhone = this.phoneService.normalize(dto.phone);

    if (!this.phoneService.isValid(dto.phone)) {
      throw new BadRequestException('Telefone inválido. Informe um número com DDD.');
    }

    // Verificar duplicidade por telefone na mesma empresa
    const existing = await this.prisma.customer.findFirst({
      where: {
        companyId,
        phoneNormalized: normalizedPhone,
        deletedAt: null,
        active: true,
      },
    });

    if (existing) {
      // Regra: não criar duplicata — retornar existente
      // O frontend deve informar o usuário
      throw new ConflictException(
        `Já existe um cliente com este telefone: ${existing.name}. Utilize o cadastro existente.`,
      );
    }

    const result = await this.prisma.customer.create({
      data: {
        name: dto.name,
        phone: this.phoneService.format(dto.phone),
        phoneNormalized: normalizedPhone,
        email: dto.email,
        document: dto.document,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        notes: dto.notes,
        active: dto.active ?? true,
        companyId,
        createdBy: userId,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'customer',
      entityId: result.id,
      newData: result as any,
    });

    this.interactionService
      .create(companyId, userId, {
        customerId: result.id,
        type: 'NOTE',
        subject: 'Cliente cadastrado',
        description: `Cliente ${result.name} cadastrado${result.phone ? ` — tel: ${result.phone}` : ''}`,
        interactionAt: new Date().toISOString(),
      })
      .catch(e => console.error('[InteractionService]', e.message, e.response?.data));

    return result;
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateCustomerDto,
  ) {
    const old = await this.findOne(companyId, id);

    const data: any = { ...dto, updatedBy: userId };

    // Se telefone foi alterado, normalizar e verificar duplicidade
    if (dto.phone && dto.phone !== old.phone) {
      const normalizedPhone = this.phoneService.normalize(dto.phone);
      data.phoneNormalized = normalizedPhone;
      data.phone = this.phoneService.format(dto.phone);

      const existing = await this.prisma.customer.findFirst({
        where: {
          companyId,
          phoneNormalized: normalizedPhone,
          id: { not: id },
          deletedAt: null,
          active: true,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Este telefone já pertence a ${existing.name}.`,
        );
      }
    }

    if (dto.birthDate) {
      data.birthDate = new Date(dto.birthDate);
    }

    const result = await this.prisma.customer.update({
      where: { id },
      data,
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'customer',
      entityId: id,
      oldData: old as any,
      newData: result as any,
    });

    return result;
  }

  async remove(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);
    const result = await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        active: false,
      },
    });

    await this.auditService.create({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'customer',
      entityId: id,
      oldData: old as any,
    });

    return result;
  }
}
