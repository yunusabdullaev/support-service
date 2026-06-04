import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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

  // Users
  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);
  const teamLeaderPass = await bcrypt.hash('Nukus@7125', 10);

  const admin = await prisma.user.create({
    data: { fullName: 'Admin User', email: 'admin@hippo.com', passwordHash: adminPass, role: 'ADMIN' },
  });

  const teamLeader = await prisma.user.create({
    data: { fullName: 'Aziz Karimov', email: 'yunusabdullaev0707@gmail.com', passwordHash: teamLeaderPass, role: 'TEAM_LEADER' },
  });

  const operator1 = await prisma.user.create({
    data: { fullName: 'Malika Yusupova', email: 'malika@hippo.com', passwordHash: userPass, role: 'OPERATOR' },
  });

  const operator2 = await prisma.user.create({
    data: { fullName: 'Jamshid Toshmatov', email: 'jamshid@hippo.com', passwordHash: userPass, role: 'OPERATOR' },
  });

  const developer = await prisma.user.create({
    data: { fullName: 'Bobur Rakhimov', email: 'bobur@hippo.com', passwordHash: userPass, role: 'DEVELOPER' },
  });

  console.log('✅ Users created');

  // Products
  const erp = await prisma.product.create({ data: { name: 'ERP Sales', description: 'Savdo va mijozlar boshqaruvi tizimi', isActive: true } });
  const edi = await prisma.product.create({ data: { name: 'EDI', description: 'Elektron hujjat almashinuvi (Electronic Data Interchange)', isActive: true } });
  const edo = await prisma.product.create({ data: { name: 'EDO', description: 'Elektron hujjat oqimi (Электронный документооборот)', isActive: true } });

  console.log('✅ Products created');

  // Bugs
  const bug1 = await prisma.bug.create({
    data: {
      title: 'ERP Sales — hisobot eksport qilinmaydi',
      productId: erp.id,
      module: 'Reports',
      description: 'Excel eksport tugmasini bosganda 500 xato chiqadi',
      stepsToReproduce: '1. Hisobotlar bo\'limiga kiring\n2. Excel eksport tugmasini bosing\n3. Xato chiqadi',
      expectedResult: 'Fayl yuklab olinadi',
      actualResult: 'Server 500 xato qaytaradi',
      priority: 'CRITICAL',
      status: 'CONFIRMED',
      assignedToId: developer.id,
      createdById: operator1.id,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.bug.create({
    data: {
      title: 'EDI — XML fayl import xatosi',
      productId: edi.id,
      module: 'Import',
      description: 'Noto\'g\'ri XML formatli fayllar import qilganda tizim ishlamay qoladi',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedToId: developer.id,
      createdById: operator2.id,
    },
  });

  await prisma.bug.create({
    data: {
      title: 'EDO — hujjat imzolash muammosi',
      productId: edo.id,
      module: 'Signing',
      description: 'EDS bilan imzolashda timeout xatosi chiqmoqda',
      priority: 'HIGH',
      status: 'NEW',
      createdById: operator1.id,
    },
  });

  await prisma.bug.create({
    data: {
      title: 'ERP Sales — filiallar orasida transfer ishlamayapti',
      productId: erp.id,
      module: 'Warehouse',
      description: 'Filiallar orasida tovar transferi yaratganda xato chiqadi',
      priority: 'MEDIUM',
      status: 'NEW',
      createdById: operator2.id,
    },
  });

  await prisma.bug.create({
    data: {
      title: 'EDO — katta hajmli hujjat yuklashda sekinlik',
      productId: edo.id,
      module: 'Upload',
      description: '5MB dan katta PDF fayllar yuklashda 30+ soniya kutish kerak',
      priority: 'LOW',
      status: 'NEW',
      createdById: teamLeader.id,
    },
  });

  await prisma.bugComment.create({
    data: {
      bugId: bug1.id,
      userId: developer.id,
      comment: 'Mahalliy muhitda takrorlandi. Excel kutubxonasida xotira muammosi. Bugun tuzatiladi.',
    },
  });

  console.log('✅ Bugs created');

  // Dialog Reviews
  const dialogText = 'Mijoz: Salom, hisobot yuklab olmayapman.\nOperator: Salom! Qaysi hujjatni yuklab olmoqchi edingiz?\nMijoz: Oylik savdo hisoboti.\nOperator: Tushundim, tekshirib ko\'raman... Muammo aniqlandi, texnik xizmatga uzatdim.\nMijoz: Qachon hal bo\'ladi?\nOperator: 1-2 ish kunida hal qilinadi. Rahmat!';

  for (let i = 0; i < 10; i++) {
    const scores = {
      firstResponseScore: Math.floor(Math.random() * 2) + 1,
      understandingScore: Math.floor(Math.random() * 2) + 1,
      solutionScore: Math.floor(Math.random() * 2) + 1,
      communicationScore: Math.floor(Math.random() * 2) + 1,
      closingScore: Math.floor(Math.random() * 2) + 1,
    };
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const operator = i % 2 === 0 ? operator1 : operator2;
    const product = i % 3 === 0 ? erp : i % 3 === 1 ? edi : edo;

    await prisma.dialogReview.create({
      data: {
        operatorId: operator.id,
        productId: product.id,
        clientName: `Mijoz ${i + 1}`,
        dialogText,
        ...scores,
        totalScore,
        status: i < 7 ? 'REVIEWED' : 'DRAFT',
        reviewedById: teamLeader.id,
        comment: totalScore >= 8 ? 'Ajoyib xizmat ko\'rsatish' : 'Javob tezligini yaxshilash kerak',
        mistakes: totalScore < 7 ? 'Javob sekin bo\'lgan. Muloqot uslubi yaxshilanishi lozim.' : null,
        reviewDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ Dialog reviews created');

  // Improvements
  await prisma.improvementRequest.create({
    data: {
      title: 'ERP Sales — mobil versiya',
      productId: erp.id,
      description: 'Savdo menejerlari uchun mobil ilova kerak. Ular ko\'pincha ofisda bo\'lmaydi.',
      requestedByClientsCount: 12,
      source: 'Mijoz fikri',
      businessValue: 'Savdo hajmini 30% oshiradi',
      status: 'PLANNED',
      createdById: teamLeader.id,
    },
  });

  await prisma.improvementRequest.create({
    data: {
      title: 'EDI — JSON format qo\'llab-quvvatlash',
      productId: edi.id,
      description: 'JSON va CSV formatlarni ham qabul qilish. Hozirda faqat XML qo\'llab-quvvatlanadi.',
      requestedByClientsCount: 7,
      source: 'Operator taklifi',
      status: 'NEW',
      createdById: operator1.id,
    },
  });

  await prisma.improvementRequest.create({
    data: {
      title: 'EDO — bulk imzolash',
      productId: edo.id,
      description: 'Bir vaqtda 100+ hujjatni imzolash imkoniyati. Hozirda har bir hujjat alohida imzolanadi.',
      requestedByClientsCount: 18,
      source: 'Mijoz fikri',
      businessValue: 'Ish unumdorligini sezilarli oshiradi',
      status: 'UNDER_REVIEW',
      createdById: operator2.id,
    },
  });

  console.log('✅ Improvements created');

  // Service Monitors
  const erpMonitor = await prisma.serviceMonitor.create({
    data: {
      name: 'ERP Sales API',
      productId: erp.id,
      url: 'https://httpbin.org/status/200',
      method: 'GET',
      expectedStatusCode: 200,
      checkIntervalSeconds: 60,
      currentStatus: 'ONLINE',
      responseTimeMs: 245,
      lastCheckedAt: new Date(),
    },
  });

  const ediMonitor = await prisma.serviceMonitor.create({
    data: {
      name: 'EDI Gateway',
      productId: edi.id,
      url: 'https://httpbin.org/status/200',
      method: 'GET',
      expectedStatusCode: 200,
      checkIntervalSeconds: 60,
      currentStatus: 'ONLINE',
      responseTimeMs: 312,
      lastCheckedAt: new Date(),
    },
  });

  await prisma.serviceMonitor.create({
    data: {
      name: 'EDO Service',
      productId: edo.id,
      url: 'https://httpbin.org/status/200',
      method: 'GET',
      expectedStatusCode: 200,
      checkIntervalSeconds: 120,
      currentStatus: 'DEGRADED',
      responseTimeMs: 3200,
      lastCheckedAt: new Date(),
    },
  });

  console.log('✅ Service monitors created');

  // Incidents
  await prisma.incident.create({
    data: {
      serviceMonitorId: erpMonitor.id,
      title: 'ERP Sales — Ma\'lumotlar bazasi ulanishi uzildi',
      description: 'ERP Sales ulanish havzasi to\'lib ketganligi sababli mavjud bo\'lmadi',
      severity: 'CRITICAL',
      status: 'RESOLVED',
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000),
      durationMinutes: 18,
      rootCause: 'Ulanish havzasi katta so\'rovlar sababli to\'lib ketdi. Havza hajmi oshirilib, muammo hal qilindi.',
      responsibleUserId: teamLeader.id,
    },
  });

  await prisma.incident.create({
    data: {
      serviceMonitorId: ediMonitor.id,
      title: 'EDI Gateway — Sekin javob vaqti',
      description: 'EDI Gateway javob vaqti 5+ soniyagacha oshdi',
      severity: 'HIGH',
      status: 'RESOLVED',
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      durationMinutes: 45,
      rootCause: 'Provayder tomon muammo. Avtomatik hal qilindi.',
      responsibleUserId: teamLeader.id,
    },
  });

  console.log('✅ Incidents created');

  // Knowledge Base
  await prisma.knowledgeArticle.create({
    data: {
      title: 'ERP Sales — Yangi foydalanuvchi qo\'shish',
      productId: erp.id,
      category: 'CRM',
      content: '# ERP Sales\'da Yangi Foydalanuvchi Qo\'shish\n\n## Qadamlar\n1. **Sozlamalar** bo\'limiga kiring\n2. **Foydalanuvchilar** bo\'limini tanlang\n3. **Qo\'shish** tugmasini bosing\n4. Ma\'lumotlarni to\'ldiring va saqlang\n\n## Muhim eslatmalar\n- Faqat Admin va Team Leader foydalanuvchi qo\'sha oladi\n- Email manzil noyob bo\'lishi kerak',
      status: 'PUBLISHED',
      createdById: teamLeader.id,
    },
  });

  await prisma.knowledgeArticle.create({
    data: {
      title: 'EDI — XML fayl tayyorlash qo\'llanmasi',
      productId: edi.id,
      category: 'COMMON_QUESTIONS',
      content: '# EDI XML Format Qo\'llanmasi\n\n## Asosiy qoidalar\n- Root element `Invoice` bo\'lishi kerak\n- Barcha sanalar ISO 8601 formatida\n- UTF-8 kodlash ishlatiladi\n\n## Namuna\n```xml\n<?xml version="1.0" encoding="UTF-8"?>\n<Invoice>\n  <Number>INV-001</Number>\n  <Date>2024-01-15</Date>\n</Invoice>\n```',
      status: 'PUBLISHED',
      createdById: admin.id,
    },
  });

  await prisma.knowledgeArticle.create({
    data: {
      title: 'EDO — Hujjat imzolash tartibi',
      productId: edo.id,
      category: 'TROUBLESHOOTING',
      content: '# EDO\'da EDS bilan Imzolash\n\n## Imzolash qadamlari\n1. Hujjatni oching\n2. **Imzolash** tugmasini bosing\n3. EDS kalitini kiriting\n4. Tasdiqlang\n\n## Muammo: Timeout xatosi\nAgar timeout xatosi chiqsa:\n- EDS muddatini tekshiring\n- Internet ulanishini tekshiring\n- Brauzer keshini tozalang',
      status: 'PUBLISHED',
      createdById: admin.id,
    },
  });

  await prisma.knowledgeArticle.create({
    data: {
      title: 'Qo\'llab-quvvatlash jamoasi ichki qoidalari',
      category: 'INTERNAL_RULES',
      content: '# Jamoa Ichki Qoidalari\n\n## Ish vaqti\n- 1-navbat: 09:00 - 18:00\n- 2-navbat: 12:00 - 21:00\n\n## SLA — Javob vaqti\n- Kritik: 5 daqiqa\n- Yuqori: 15 daqiqa\n- Oddiy: 1 soat\n\n## Eskalatsiya\n1. Operator hal qilishga harakat qiladi\n2. 10 daqiqa o\'tsa → Team Leader ga\n3. Team Leader → Dasturlash bo\'limiga\n\n## Xato hisoboti\nBarcha xatolar Bug Tracker\'da qayd etilishi shart',
      status: 'PUBLISHED',
      createdById: admin.id,
    },
  });

  console.log('✅ Knowledge articles created');

  // Telegram Settings
  await prisma.telegramSetting.create({
    data: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || 'your_bot_token_here',
      chatId: process.env.TELEGRAM_CHAT_ID || 'your_chat_id_here',
      isActive: false,
    },
  });

  console.log('✅ Telegram settings created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:       admin@hippo.com / admin123');
  console.log('  Team Leader: yunusabdullaev0707@gmail.com / Nukus@7125');
  console.log('  Operator 1:  malika@hippo.com / user123');
  console.log('  Operator 2:  jamshid@hippo.com / user123');
  console.log('  Developer:   bobur@hippo.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
