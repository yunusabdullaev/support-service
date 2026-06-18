import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BugsController } from './bugs.controller';
import { BugsService } from './bugs.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp|svg|pdf)$/i;
        cb(null, allowed.test(file.originalname));
      },
    }),
  ],
  controllers: [BugsController],
  providers: [BugsService],
  exports: [BugsService],
})
export class BugsModule {}
