import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, DashboardModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
