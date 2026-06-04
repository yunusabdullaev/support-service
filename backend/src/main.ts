import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      const frontendUrl = process.env.FRONTEND_URL;
      const sanitizedOrigin = origin ? origin.replace(/\/$/, '') : '';
      const sanitizedFrontend = frontendUrl ? frontendUrl.replace(/\/$/, '') : '';

      // Allow requests from any localhost port, or no origin (curl, Postman, etc.), or the configured FRONTEND_URL
      if (
        !origin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        origin === 'http://127.0.0.1:3002' ||
        (sanitizedFrontend && sanitizedOrigin === sanitizedFrontend)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Hippo Support API running on http://localhost:${port}`);
}
bootstrap();
