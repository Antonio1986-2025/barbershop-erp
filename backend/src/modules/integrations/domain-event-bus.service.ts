import { Injectable, Logger } from '@nestjs/common';

type EventHandler = (payload: any) => Promise<void>;

@Injectable()
export class DomainEventBus {
  private readonly logger = new Logger(DomainEventBus.name);
  private handlers = new Map<string, EventHandler[]>();

  subscribe(eventName: string, handler: EventHandler) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
    this.logger.log(`Handler registrado para ${eventName}`);
  }

  async publish(eventName: string, payload: any) {
    const handlers = this.handlers.get(eventName);
    if (!handlers || handlers.length === 0) return;

    this.logger.log(`Publicando ${eventName}`);

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err: any) {
        this.logger.error(`Erro no handler de ${eventName}: ${err.message}`);
      }
    }
  }
}
