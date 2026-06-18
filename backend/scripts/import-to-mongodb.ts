/**
 * Migration script: Import PostgreSQL JSON exports into MongoDB
 * 
 * Usage:
 *   MONGODB_URL="mongodb+srv://..." npx ts-node scripts/import-to-mongodb.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const EXPORT_DIR = path.join(__dirname, '..', '..', 'db_export');

// Map old cuid IDs to new MongoDB ObjectIds
const idMap: Record<string, string> = {};

function readJsonLines(filename: string): any[] {
  const filepath = path.join(EXPORT_DIR, `${filename}.json`);
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠️ File not found: ${filename}.json`);
    return [];
  }
  const content = fs.readFileSync(filepath, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').map(line => JSON.parse(line));
}

async function importUsers() {
  const rows = readJsonLines('users');
  console.log(`\n📥 Importing ${rows.length} users...`);
  for (const row of rows) {
    const created = await prisma.user.create({
      data: {
        fullName: row.fullName,
        email: row.email,
        phone: (row.phone && row.phone.trim()) ? row.phone : undefined,
        telegramChatId: row.telegramChatId || undefined,
        passwordHash: row.passwordHash,
        role: row.role,
        isActive: row.isActive,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    });
    idMap[row.id] = created.id;
    console.log(`  ✅ User: ${row.fullName} (${row.id} → ${created.id})`);
  }
}

async function importProducts() {
  const rows = readJsonLines('products');
  console.log(`\n📥 Importing ${rows.length} products...`);
  for (const row of rows) {
    const created = await prisma.product.create({
      data: {
        name: row.name,
        description: row.description,
        isActive: row.isActive,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    });
    idMap[row.id] = created.id;
    console.log(`  ✅ Product: ${row.name}`);
  }
}

async function importTelegramSettings() {
  const rows = readJsonLines('telegram_settings');
  console.log(`\n📥 Importing ${rows.length} telegram settings...`);
  for (const row of rows) {
    const created = await prisma.telegramSetting.create({
      data: {
        botToken: row.botToken || '',
        phones: row.phones || '',
        isActive: row.isActive,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    });
    idMap[row.id] = created.id;
  }
}

async function importBugs() {
  const rows = readJsonLines('bugs');
  console.log(`\n📥 Importing ${rows.length} bugs...`);
  for (const row of rows) {
    const created = await prisma.bug.create({
      data: {
        title: row.title,
        productId: idMap[row.productId],
        module: row.module,
        clientPhone: row.clientPhone,
        description: row.description,
        stepsToReproduce: row.stepsToReproduce,
        expectedResult: row.expectedResult,
        actualResult: row.actualResult,
        priority: row.priority,
        status: row.status,
        reportedByClientsCount: row.reportedByClientsCount || 1,
        assignedToId: row.assignedToId ? idMap[row.assignedToId] : undefined,
        createdById: idMap[row.createdById],
        deadline: row.deadline ? new Date(row.deadline) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    });
    idMap[row.id] = created.id;
    console.log(`  ✅ Bug: ${row.title}`);
  }
}

async function importBugComments() {
  const rows = readJsonLines('bug_comments');
  console.log(`\n📥 Importing ${rows.length} bug comments...`);
  for (const row of rows) {
    if (!idMap[row.bugId] || !idMap[row.userId]) continue;
    const created = await prisma.bugComment.create({
      data: {
        bugId: idMap[row.bugId],
        userId: idMap[row.userId],
        comment: row.comment,
        createdAt: new Date(row.createdAt),
      },
    });
    idMap[row.id] = created.id;
  }
}

async function importBugAttachments() {
  const rows = readJsonLines('bug_attachments');
  console.log(`\n📥 Importing ${rows.length} bug attachments...`);
  for (const row of rows) {
    if (!idMap[row.bugId]) continue;
    const created = await prisma.bugAttachment.create({
      data: {
        bugId: idMap[row.bugId],
        userId: row.userId ? idMap[row.userId] : undefined,
        fileUrl: row.fileUrl,
        fileName: row.fileName,
        fileType: row.fileType,
        createdAt: new Date(row.createdAt),
      },
    });
    idMap[row.id] = created.id;
  }
}

async function importBugUpvotes() {
  const rows = readJsonLines('bug_upvotes');
  console.log(`\n📥 Importing ${rows.length} bug upvotes...`);
  for (const row of rows) {
    if (!idMap[row.bugId]) continue;
    const created = await prisma.bugUpvote.create({
      data: {
        bugId: idMap[row.bugId],
        phone: row.phone,
        createdAt: new Date(row.createdAt),
      },
    });
    idMap[row.id] = created.id;
  }
}

async function importClients() {
  const rows = readJsonLines('clients');
  console.log(`\n📥 Importing ${rows.length} clients...`);
  for (const row of rows) {
    const created = await prisma.client.create({
      data: {
        fullName: row.fullName,
        phone: row.phone,
        direction: row.direction,
        position: row.position,
        location: row.location,
        branchCount: row.branchCount || 1,
        employeeCount: row.employeeCount || 0,
        referredFrom: row.referredFrom,
        note: row.note,
        isActive: row.isActive,
        createdById: row.createdById ? idMap[row.createdById] : undefined,
        productId: row.productId ? idMap[row.productId] : undefined,
        installationStatus: row.installationStatus || 'NEW',
        bitrixStatus: row.bitrixStatus || 'NOT_ADDED',
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    });
    idMap[row.id] = created.id;
    console.log(`  ✅ Client: ${row.fullName}`);
  }
}

async function importClientComments() {
  const rows = readJsonLines('client_comments');
  console.log(`\n📥 Importing ${rows.length} client comments...`);
  for (const row of rows) {
    if (!idMap[row.clientId] || !idMap[row.createdById]) continue;
    const created = await prisma.clientComment.create({
      data: {
        clientId: idMap[row.clientId],
        text: row.text,
        createdById: idMap[row.createdById],
        createdAt: new Date(row.createdAt),
      },
    });
    idMap[row.id] = created.id;
  }
}

async function importDifficulties() {
  const rows = readJsonLines('difficulties');
  console.log(`\n📥 Importing ${rows.length} difficulties...`);
  for (const row of rows) {
    const created = await prisma.difficulty.create({
      data: {
        title: row.title,
        productId: row.productId ? idMap[row.productId] : undefined,
        clientPhone: row.clientPhone,
        description: row.description,
        status: row.status,
        reportedByCount: row.reportedByCount || 1,
        createdById: idMap[row.createdById],
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    });
    idMap[row.id] = created.id;
    console.log(`  ✅ Difficulty: ${row.title}`);
  }
}

async function importDifficultyUpvotes() {
  const rows = readJsonLines('difficulty_upvotes');
  console.log(`\n📥 Importing ${rows.length} difficulty upvotes...`);
  for (const row of rows) {
    if (!idMap[row.difficultyId]) continue;
    const created = await prisma.difficultyUpvote.create({
      data: {
        difficultyId: idMap[row.difficultyId],
        phone: row.phone,
        createdAt: new Date(row.createdAt),
      },
    });
    idMap[row.id] = created.id;
  }
}

async function importImprovements() {
  const rows = readJsonLines('improvement_requests');
  console.log(`\n📥 Importing ${rows.length} improvement requests...`);
  for (const row of rows) {
    const created = await prisma.improvementRequest.create({
      data: {
        title: row.title,
        productId: idMap[row.productId],
        description: row.description,
        requestedByClientsCount: row.requestedByClientsCount || 0,
        source: row.source,
        clientPhone: row.clientPhone,
        businessValue: row.businessValue,
        status: row.status,
        createdById: idMap[row.createdById],
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    });
    idMap[row.id] = created.id;
    console.log(`  ✅ Improvement: ${row.title}`);
  }
}

async function importKnowledgeArticles() {
  const rows = readJsonLines('knowledge_articles');
  console.log(`\n📥 Importing ${rows.length} knowledge articles...`);
  for (const row of rows) {
    const created = await prisma.knowledgeArticle.create({
      data: {
        title: row.title,
        productId: row.productId ? idMap[row.productId] : undefined,
        category: row.category,
        content: row.content,
        status: row.status,
        createdById: idMap[row.createdById],
        updatedById: row.updatedById ? idMap[row.updatedById] : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    });
    idMap[row.id] = created.id;
  }
}

async function main() {
  console.log('🚀 Starting PostgreSQL → MongoDB migration...\n');
  console.log(`📂 Export directory: ${EXPORT_DIR}`);

  try {
    // Clean up existing data first (for re-runs)
    console.log('🗑️  Cleaning up existing data...');
    await prisma.difficultyUpvote.deleteMany({});
    await prisma.bugUpvote.deleteMany({});
    await prisma.improvementUpvote.deleteMany({});
    await prisma.bugAttachment.deleteMany({});
    await prisma.bugComment.deleteMany({});
    await prisma.clientComment.deleteMany({});
    await prisma.monitorLog.deleteMany({});
    await prisma.incident.deleteMany({});
    await prisma.difficulty.deleteMany({});
    await prisma.improvementRequest.deleteMany({});
    await prisma.knowledgeArticle.deleteMany({});
    await prisma.dialogReview.deleteMany({});
    await prisma.bug.deleteMany({});
    await prisma.serviceMonitor.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.telegramSetting.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Cleanup done!\n');

    // Import in dependency order
    await importUsers();
    await importProducts();
    await importTelegramSettings();
    await importBugs();
    await importBugComments();
    await importBugAttachments();
    await importBugUpvotes();
    await importClients();
    await importClientComments();
    await importDifficulties();
    await importDifficultyUpvotes();
    await importImprovements();
    await importKnowledgeArticles();

    console.log('\n\n✅✅✅ Migration completed successfully! ✅✅✅');
    console.log(`Total ID mappings: ${Object.keys(idMap).length}`);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
