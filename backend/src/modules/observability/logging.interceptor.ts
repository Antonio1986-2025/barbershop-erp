import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, path, body } = req;
    const requestId = req.headers['x-request-id'] as string;
    const user = (req as any).user;
    const userId = user?.id ?? 'anonymous';
    const start = Date.now();

    const sanitized = this.sanitize(body);

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const duration = Date.now() - start;
          this.logger.log(
            JSON.stringify({
              requestId,
              method,
              path,
              status: res.statusCode,
              duration: `${duration}ms`,
              userId,
              ...(sanitized ? { body: sanitized } : {}),
            }),
          );
        },
        error: (err) => {
          const duration = Date.now() - start;
          this.logger.error(
            JSON.stringify({
              requestId,
              method,
              path,
              status: err.status ?? 500,
              duration: `${duration}ms`,
              userId,
              error: err.message,
            }),
          );
        },
      }),
    );
  }

  private sanitize(body: any): Record<string, any> | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const sensitive = ['password', 'token', 'refreshToken', 'accessToken'];
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (sensitive.includes(key)) {
        result[key] = '***';
      } else if (typeof value === 'object' && value !== null) {
        const cleaned = this.sanitize(value);
        if (cleaned && Object.keys(cleaned).length) {
          result[key] = cleaned;
        }
      } else {
        result[key] = value;
      }
    }
    return Object.keys(result).length ? result : undefined;
  }
}
