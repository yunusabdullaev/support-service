import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  // Clean existing data
  await prisma.monitorLog.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.serviceMonitor.deleteMany();
  await prisma.bugComment.deleteMany();
  await prisma.bugAttachment.deleteMany();
  await prisma.bug.deleteMany();
  await prisma.improvementRequest.deleteMany();
  await prisma.dialogReview.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.telegramSetting.deleteMany();

  // Create single ADMIN user (User's account)
  const passwordHash = await bcrypt.hash('Nukus@7125', 10);
  await prisma.user.create({
    data: {
      fullName: 'Yunus Abdullaev',
      email: 'yunusabdullaev0707@gmail.com',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created: yunusabdullaev0707@gmail.com');

  // Create standard products
  await prisma.product.create({ data: { name: 'ERP', description: 'Savdo va mijozlar boshqaruvi tizimi', isActive: true } });
  await prisma.product.create({ data: { name: 'EDI', description: 'Elektron hujjat almashinuvi (Electronic Data Interchange)', isActive: true } });
  await prisma.product.create({ data: { name: 'EDO', description: 'Elektron hujjat oqimi (Электронный документооборот)', isActive: true } });

  console.log('✅ Standard products created');

  // Create default Telegram settings row
  await prisma.telegramSetting.create({
    data: {
      botToken: '',
      phones: '',
      isActive: false,
    },
  });

  console.log('✅ Initial Telegram settings placeholder created');
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
