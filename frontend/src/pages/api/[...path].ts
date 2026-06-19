import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../nest/src/app.module';
import { ValidationPipe } from '@nestjs/common';
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

let app: any;
let seeded = false;

async function getApp() {
  if (app) return app;

  app = await NestFactory.create(AppModule, {
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

  await app.init();

  // Auto-seed on first boot
  if (!seeded) {
    seeded = true;
    const prisma = new PrismaClient();
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('🌱 Auto-seeding...');
        const hash = await bcrypt.hash('Nukus@7125', 10);
        await prisma.user.create({
          data: {
            fullName: 'Yunus Abdullaev',
            email: 'yunusabdullaev0707@gmail.com',
            passwordHash: hash,
            role: 'ADMIN',
            isActive: true,
          },
        });
      }
    } catch (e) {
      console.error('Seed error:', e);
    } finally {
      await prisma.$disconnect();
    }
  }

  return app;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const nestApp = await getApp();
  const instance = nestApp.getHttpAdapter().getInstance();

  // Rewrite URL: /api/xxx -> /xxx (NestJS routes don't have /api prefix)
  req.url = req.url?.replace(/^\/api/, '') || '/';

  await new Promise<void>((resolve, reject) => {
    instance(req, res, (err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
