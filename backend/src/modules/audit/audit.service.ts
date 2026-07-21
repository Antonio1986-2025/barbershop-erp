import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

const SENSITIVE_KEYS = new Set([
  'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
  'credential', 'secret', 'apiKey',
]);

function stripSensitive(data: Record<string, any> | null): Record<string, any> | null {
  if (!data) return null;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = stripSensitive(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    companyId: string;
    userId: string;
    action: AuditAction;
    entity: string;
    entityId?: string;
    oldData?: Record<string, any> | null;
    newData?: Record<string, any> | null;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: params.oldData ? JSON.stringify(stripSensitive(params.oldData)) : null,
        newData: params.newData ? JSON.stringify(stripSensitive(params.newData)) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      entity?: string;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (query.entity) where.entity = query.entity;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
