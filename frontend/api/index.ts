import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';
import serverlessExpress from '@vendia/serverless-express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

let cachedServer: any;

async function bootstrap() {
  if (cachedServer) return cachedServer;

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

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
        await prisma.product.create({ data: { name: 'ERP', description: 'Savdo va mijozlar boshqaruvi tizimi', isActive: true } });
        await prisma.product.create({ data: { name: 'EDI', description: 'Elektron hujjat almashinuvi (Electronic Data Interchange)', isActive: true } });
        await prisma.product.create({ data: { name: 'EDO', description: 'Elektron hujjat oqimi (Электронный документооборот)', isActive: true } });
        console.log('✅ Default products created.');
      }

      const tgCount = await prisma.telegramSetting.count();
      if (tgCount === 0) {
        await prisma.telegramSetting.create({
          data: {
            botToken: '',
            phones: '',
            isActive: false,
          },
        });
      }
    }
  } catch (error) {
    console.error('❌ Database connection or seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  cachedServer = serverlessExpress({ app: expressApp });
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  return server(req, res);
}
