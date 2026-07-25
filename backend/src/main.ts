import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { AppModule } from './app.module';
import { RequestIdMiddleware } from './modules/observability/request-id.middleware';
import { LoggingInterceptor } from './modules/observability/logging.interceptor';
import { GlobalExceptionFilter } from './modules/observability/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3000',
      'http://192.168.1.6:3000',
      'http://192.168.1.6:3003',
      'http://localhost:3001',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health', 'health/live', 'health/ready'] });
  app.use(compression());
  app.use(new RequestIdMiddleware().use);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(3001);
}
bootstrap();
