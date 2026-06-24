import { Module } from '@nestjs/common';
import { DialogReviewsController } from './dialog-reviews.controller';
import { DialogReviewsService } from './dialog-reviews.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [DialogReviewsController],
  providers: [DialogReviewsService],
  exports: [DialogReviewsService],
})
export class DialogReviewsModule {}
