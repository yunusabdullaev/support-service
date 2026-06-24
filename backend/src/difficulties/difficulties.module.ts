import { Module } from '@nestjs/common';
import { DifficultiesController } from './difficulties.controller';
import { DifficultiesService } from './difficulties.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [PrismaModule, TelegramModule],
  controllers: [DifficultiesController],
  providers: [DifficultiesService],
  exports: [DifficultiesService],
})
export class DifficultiesModule {}
