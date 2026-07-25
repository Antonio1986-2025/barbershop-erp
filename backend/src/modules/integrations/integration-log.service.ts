import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IntegrationLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(integrationId: string, query: { page?: string; limit?: string }) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        where: { integrationId },
        skip, take: limit,
        orderBy: { processedAt: 'desc' },
      }),
      this.prisma.integrationLog.count({ where: { integrationId } }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async log(params: {
    integrationId: string;
    eventName: string;
    direction: 'INBOUND' | 'OUTBOUND';
    payload?: any;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
  }) {
    return this.prisma.integrationLog.create({
      data: {
        integrationId: params.integrationId,
        eventName: params.eventName,
        direction: params.direction,
        payload: params.payload ? JSON.stringify(params.payload) : null,
        status: params.status,
        error: params.error,
      },
    });
  }
}
