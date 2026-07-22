import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger('Cache');
  private readonly store = new Map<string, CacheEntry<any>>();
  private readonly memoryTtl: number;

  constructor() {
    this.memoryTtl = parseInt(process.env.CACHE_TTL ?? '300', 10) * 1000;
    this.logger.log(`Cache in-memory iniciado (TTL: ${this.memoryTtl / 1000}s)`);
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.memoryTtl / 1000) * 1000;
    this.store.set(key, { data, expiresAt: Date.now() + ttl });
  }

  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const data = await fn();
    this.set(key, data, ttlSeconds);
    return data;
  }

  del(key: string): void {
    this.store.delete(key);
  }

  delByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  reset(): void {
    this.store.clear();
  }
}
