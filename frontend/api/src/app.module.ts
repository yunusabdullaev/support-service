import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { BugsModule } from './bugs/bugs.module';
import { DialogReviewsModule } from './dialog-reviews/dialog-reviews.module';
import { ImprovementsModule } from './improvements/improvements.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { IncidentsModule } from './incidents/incidents.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { TelegramModule } from './telegram/telegram.module';
import { SettingsModule } from './settings/settings.module';
import { ClientsModule } from './clients/clients.module';
import { DifficultiesModule } from './difficulties/difficulties.module';
import { memoryStorage } from 'multer';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    BugsModule,
    DialogReviewsModule,
    ImprovementsModule,
    MonitoringModule,
    IncidentsModule,
    KnowledgeBaseModule,
    DashboardModule,
    ReportsModule,
    TelegramModule,
    SettingsModule,
    ClientsModule,
    DifficultiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
