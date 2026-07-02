import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function run() {
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const backupDir = path.join(__dirname, '..', 'db_export', `backup_${dateStr}_${timeStr}`);
  
  console.log(`🚀 Starting MongoDB backup to: ${backupDir}...`);
  fs.mkdirSync(backupDir, { recursive: true });

  const exportTable = async (name: string, data: any[]) => {
    const file = path.join(backupDir, `${name}.json`);
    const content = data.map(row => JSON.stringify(row)).join('\n');
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`  💾 Saved ${data.length} records to ${name}.json`);
  };

  try {
    const users = await prisma.user.findMany();
    await exportTable('users', users);

    const products = await prisma.product.findMany();
    await exportTable('products', products);

    const telegramSettings = await prisma.telegramSetting.findMany();
    await exportTable('telegram_settings', telegramSettings);

    const bugs = await prisma.bug.findMany();
    await exportTable('bugs', bugs);

    const bugComments = await prisma.bugComment.findMany();
    await exportTable('bug_comments', bugComments);

    const bugAttachments = await prisma.bugAttachment.findMany();
    await exportTable('bug_attachments', bugAttachments);

    const bugUpvotes = await prisma.bugUpvote.findMany();
    await exportTable('bug_upvotes', bugUpvotes);

    const clients = await prisma.client.findMany();
    await exportTable('clients', clients);

    const clientComments = await prisma.clientComment.findMany();
    await exportTable('client_comments', clientComments);

    const difficulties = await prisma.difficulty.findMany();
    await exportTable('difficulties', difficulties);

    const difficultyUpvotes = await prisma.difficultyUpvote.findMany();
    await exportTable('difficulty_upvotes', difficultyUpvotes);

    const improvements = await prisma.improvementRequest.findMany();
    await exportTable('improvement_requests', improvements);

    const knowledgeArticles = await prisma.knowledgeArticle.findMany();
    await exportTable('knowledge_articles', knowledgeArticles);

    const shiftAssignments = await prisma.shiftAssignment.findMany();
    await exportTable('shift_assignments', shiftAssignments);

    console.log('\n✅ Backup completed successfully!');
  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
