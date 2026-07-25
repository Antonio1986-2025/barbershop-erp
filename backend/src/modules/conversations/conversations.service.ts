import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { ConversationQueryDto, MessageQueryDto } from './dto/conversation-query.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  async findAll(companyId: string, query: ConversationQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (query.status) where.status = query.status;
    if (query.assignedTo) where.assignedToId = query.assignedTo;
    if (query.customerId) where.customerId = query.customerId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where, skip, take: limit,
        orderBy: [{ priority: 'desc' }, { lastMessageAt: 'desc' }],
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          tags: { select: { tag: true } },
          _count: { select: { messages: true, notes: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(companyId: string, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, companyId },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        tags: { select: { tag: true } },
        _count: { select: { messages: true, notes: true } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    return conversation;
  }

  async getMessages(companyId: string, id: string, query: MessageQueryDto) {
    await this.findOne(companyId, id);

    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = { conversationId: id };
    if (query.direction) where.direction = query.direction;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.conversationMessage.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.conversationMessage.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async sendMessage(companyId: string, id: string, userId: string, content: string, integrationId?: string) {
    const conversation = await this.findOne(companyId, id);

    let integration = integrationId
      ? await this.prisma.integration.findFirst({ where: { id: integrationId, companyId, active: true } })
      : await this.prisma.integration.findFirst({ where: { companyId, provider: 'evolution', active: true } });

    if (!integration) {
      throw new BadRequestException('Nenhuma integração Evolution ativa configurada');
    }

    const customer = await this.prisma.customer.findFirst({ where: { id: conversation.customerId, companyId } });
    const phone = customer?.phone;
    if (!phone) {
      throw new BadRequestException('Cliente não possui telefone');
    }

    const result = await this.integrationsService.sendMessage(companyId, integration.id, phone, content);

    const now = new Date();
    const message = await this.prisma.conversationMessage.create({
      data: {
        conversationId: id,
        direction: 'OUTBOUND',
        content,
        status: result.sent ? 'SENT' : 'FAILED',
        externalId: result.response?.key?.id ?? null,
      },
    });

    await this.prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: now,
        lastAgentMessageAt: now,
        firstResponseAt: conversation.firstResponseAt ?? now,
      },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'ConversationMessage', entityId: message.id,
      newData: { conversationId: id, direction: 'OUTBOUND', content } as any,
    });

    return message;
  }

  async assign(companyId: string, id: string, userId: string, assignedToId: string) {
    const old = await this.findOne(companyId, id);

    const result = await this.prisma.conversation.update({
      where: { id },
      data: { assignedToId, assignedAt: old.assignedToId ? undefined : new Date() },
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'Conversation', entityId: id,
      oldData: { assignedToId: old.assignedToId } as any,
      newData: { assignedToId } as any,
    });

    return result;
  }

  async setPriority(companyId: string, id: string, userId: string, priority: string) {
    const old = await this.findOne(companyId, id);

    const result = await this.prisma.conversation.update({
      where: { id },
      data: { priority: priority as any },
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'Conversation', entityId: id,
      oldData: { priority: old.priority } as any,
      newData: { priority } as any,
    });

    return result;
  }

  async close(companyId: string, id: string, userId: string) {
    const old = await this.findOne(companyId, id);

    const result = await this.prisma.conversation.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    await this.auditService.create({
      companyId, userId, action: 'UPDATE', entity: 'Conversation', entityId: id,
      oldData: { status: old.status } as any,
      newData: { status: 'CLOSED' } as any,
    });

    return result;
  }

  // ── Notes ──

  async addNote(companyId: string, id: string, userId: string, content: string) {
    await this.findOne(companyId, id);

    const note = await this.prisma.conversationNote.create({
      data: { conversationId: id, userId, content },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'ConversationNote', entityId: note.id,
      newData: { conversationId: id } as any,
    });

    return note;
  }

  async getNotes(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.conversationNote.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Tags ──

  async addTag(companyId: string, id: string, userId: string, tag: string) {
    await this.findOne(companyId, id);

    const result = await this.prisma.conversationTag.create({
      data: { conversationId: id, tag },
    });

    await this.auditService.create({
      companyId, userId, action: 'CREATE', entity: 'ConversationTag', entityId: result.id,
      newData: { conversationId: id, tag } as any,
    });

    return result;
  }

  async removeTag(companyId: string, id: string, tagId: string, userId: string) {
    await this.findOne(companyId, id);
    await this.prisma.conversationTag.delete({ where: { id: tagId } });
  }

  // ── Inbound ──

  async handleIncoming(companyId: string, customerId: string, content: string, externalId?: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { companyId, customerId, channel: 'WHATSAPP', status: 'OPEN' },
    });

    if (!conversation) {
      const closed = await this.prisma.conversation.findFirst({
        where: { companyId, customerId, channel: 'WHATSAPP', status: 'CLOSED' },
        orderBy: { lastMessageAt: 'desc' },
      });

      if (closed) {
        conversation = await this.prisma.conversation.update({
          where: { id: closed.id },
          data: { status: 'OPEN', lastMessageAt: new Date() },
        });
      } else {
        conversation = await this.prisma.conversation.create({
          data: { companyId, customerId, channel: 'WHATSAPP' },
        });
      }
    }

    const message = await this.prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        content,
        externalId,
        status: 'DELIVERED',
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return { conversation, message };
  }
}
