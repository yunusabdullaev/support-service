import { Module } from '@nestjs/common';
import { DialogReviewsController } from './dialog-reviews.controller';
import { DialogReviewsService } from './dialog-reviews.service';

@Module({
  controllers: [DialogReviewsController],
  providers: [DialogReviewsService],
  exports: [DialogReviewsService],
})
export class DialogReviewsModule {}
