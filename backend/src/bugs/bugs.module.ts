import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BugsController } from './bugs.controller';
import { BugsService } from './bugs.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TelegramModule,
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
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
