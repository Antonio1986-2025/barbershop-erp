import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
export class HealthController {
  private readonly startedAt: number;

  constructor(private readonly prisma: PrismaService) {
    this.startedAt = Date.now();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION ?? '0.0.0',
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  @Get('health/live')
  live() {
    return { alive: true };
  }

  @Get('health/ready')
  async ready() {
    let db = false;
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      db = true;
    } catch {}

    return {
      status: db ? 'ok' : 'degraded',
      checks: {
        database: db ? 'connected' : 'disconnected',
      },
    };
  }
}
