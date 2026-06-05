import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing admin user (NO data deletion)...');

  // Fix telegram_settings table — ensure phones column exists
  // (chatId and recipients were removed in schema update)
  try {
    const tgCount = await prisma.telegramSetting.count();
    if (tgCount === 0) {
      await prisma.telegramSetting.create({
        data: { botToken: '', phones: '', isActive: false },
      });
      console.log('✅ Telegram settings placeholder created');
    } else {
      console.log('✅ Telegram settings already exists');
    }
  } catch (e) {
    console.error('Telegram settings error:', e.message);
  }

  // Upsert ADMIN user — create if not exists, update password if exists
  const passwordHash = await bcrypt.hash('Nukus@7125', 10);
  const existing = await prisma.user.findUnique({
    where: { email: 'yunusabdullaev0707@gmail.com' },
  });

  if (existing) {
    await prisma.user.update({
      where: { email: 'yunusabdullaev0707@gmail.com' },
      data: { passwordHash, role: 'ADMIN', isActive: true },
    });
    console.log('✅ Admin password reset: yunusabdullaev0707@gmail.com / Nukus@7125');
  } else {
    await prisma.user.create({
      data: {
        fullName: 'Yunus Abdullaev',
        email: 'yunusabdullaev0707@gmail.com',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('✅ Admin user created: yunusabdullaev0707@gmail.com / Nukus@7125');
  }

  // Ensure products exist
  const prodCount = await prisma.product.count();
  if (prodCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'ERP', description: 'Savdo va mijozlar boshqaruvi tizimi', isActive: true },
        { name: 'EDI', description: 'Elektron hujjat almashinuvi', isActive: true },
        { name: 'EDO', description: 'Elektron hujjat oqimi', isActive: true },
      ],
    });
    console.log('✅ Products created');
  } else {
    console.log(`✅ Products already exist (${prodCount} ta)`);
  }

  // Count all data for report
  const users = await prisma.user.count();
  const clients = await prisma.client.count();
  const bugs = await prisma.bug.count();

  console.log('\n📊 Current DB state:');
  console.log(`  Users: ${users}`);
  console.log(`  Clients: ${clients}`);
  console.log(`  Bugs: ${bugs}`);
  console.log('\n🎉 Fix completed! Login: yunusabdullaev0707@gmail.com / Nukus@7125');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
