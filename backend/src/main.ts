import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  // Auto-seed database if empty
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 No users found in database. Auto-seeding Admin user...');
      const adminPass = await bcrypt.hash('Nukus@7125', 10);
      await prisma.user.create({
        data: {
          fullName: 'Yunus Abdullaev',
          email: 'yunusabdullaev0707@gmail.com',
          passwordHash: adminPass,
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log('✅ Auto-seed completed. Admin created.');

      const productCount = await prisma.product.count();
      if (productCount === 0) {
        await prisma.product.create({ data: { name: 'ERP Sales', description: 'Savdo va mijozlar boshqaruvi tizimi', isActive: true } });
        await prisma.product.create({ data: { name: 'EDI', description: 'Elektron hujjat almashinuvi (Electronic Data Interchange)', isActive: true } });
        await prisma.product.create({ data: { name: 'EDO', description: 'Elektron hujjat oqimi (Электронный документооборот)', isActive: true } });
        console.log('✅ Default products created.');
      }

      const tgCount = await prisma.telegramSetting.count();
      if (tgCount === 0) {
        await prisma.telegramSetting.create({
          data: {
            botToken: '',
            chatId: '',
            isActive: false,
          },
        });
      }
    }
  } catch (error) {
    console.error('❌ Database connection or seeding failed during bootstrap:', error);
  } finally {
    await prisma.$disconnect();
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Hippo Support API running on http://localhost:${port}`);
}
bootstrap();
