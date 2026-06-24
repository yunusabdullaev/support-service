import { Module } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [ShiftsController],
  providers: [ShiftsService],
})
export class ShiftsModule {}
