import { Module } from '@nestjs/common';
import { ImprovementsController } from './improvements.controller';
import { ImprovementsService } from './improvements.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [ImprovementsController],
  providers: [ImprovementsService],
  exports: [ImprovementsService],
})
export class ImprovementsModule {}
