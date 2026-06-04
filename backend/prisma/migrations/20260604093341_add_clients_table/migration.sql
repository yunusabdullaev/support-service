-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "BugPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('NEW', 'CONFIRMED', 'IN_PROGRESS', 'WAITING', 'FIXED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ImprovementStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'PLANNED', 'IN_DEVELOPMENT', 'DONE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ONLINE', 'DEGRADED', 'OFFLINE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DialogReviewStatus" AS ENUM ('DRAFT', 'REVIEWED', 'NEEDS_TRAINING');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('CRM', 'SIPUNI', 'SARKOR', 'MODERATOR', 'COMMON_QUESTIONS', 'TROUBLESHOOTING', 'INTERNAL_RULES');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialog_reviews" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "dialogText" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstResponseScore" INTEGER NOT NULL DEFAULT 0,
    "understandingScore" INTEGER NOT NULL DEFAULT 0,
    "solutionScore" INTEGER NOT NULL DEFAULT 0,
    "communicationScore" INTEGER NOT NULL DEFAULT 0,
    "closingScore" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "mistakes" TEXT,
    "comment" TEXT,
    "status" "DialogReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialog_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bugs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "module" TEXT,
    "description" TEXT NOT NULL,
    "stepsToReproduce" TEXT,
    "expectedResult" TEXT,
    "actualResult" TEXT,
    "priority" "BugPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "BugStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bug_attachments" (
    "id" TEXT NOT NULL,
    "bugId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bug_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bug_comments" (
    "id" TEXT NOT NULL,
    "bugId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bug_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "improvement_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedByClientsCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "businessValue" TEXT,
    "status" "ImprovementStatus" NOT NULL DEFAULT 'NEW',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "improvement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_monitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "expectedStatusCode" INTEGER NOT NULL DEFAULT 200,
    "checkIntervalSeconds" INTEGER NOT NULL DEFAULT 300,
    "currentStatus" "ServiceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "responseTimeMs" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_monitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitor_logs" (
    "id" TEXT NOT NULL,
    "serviceMonitorId" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL,
    "responseTimeMs" INTEGER,
    "statusCode" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,

    CONSTRAINT "monitor_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "serviceMonitorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'HIGH',
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "rootCause" TEXT,
    "responsibleUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productId" TEXT,
    "category" "ArticleCategory" NOT NULL DEFAULT 'COMMON_QUESTIONS',
    "content" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_settings" (
    "id" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "direction" TEXT,
    "position" TEXT,
    "location" TEXT,
    "branchCount" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");

-- AddForeignKey
ALTER TABLE "dialog_reviews" ADD CONSTRAINT "dialog_reviews_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_reviews" ADD CONSTRAINT "dialog_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_reviews" ADD CONSTRAINT "dialog_reviews_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bugs" ADD CONSTRAINT "bugs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bugs" ADD CONSTRAINT "bugs_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bugs" ADD CONSTRAINT "bugs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_attachments" ADD CONSTRAINT "bug_attachments_bugId_fkey" FOREIGN KEY ("bugId") REFERENCES "bugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_comments" ADD CONSTRAINT "bug_comments_bugId_fkey" FOREIGN KEY ("bugId") REFERENCES "bugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_comments" ADD CONSTRAINT "bug_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improvement_requests" ADD CONSTRAINT "improvement_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improvement_requests" ADD CONSTRAINT "improvement_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_monitors" ADD CONSTRAINT "service_monitors_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitor_logs" ADD CONSTRAINT "monitor_logs_serviceMonitorId_fkey" FOREIGN KEY ("serviceMonitorId") REFERENCES "service_monitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_serviceMonitorId_fkey" FOREIGN KEY ("serviceMonitorId") REFERENCES "service_monitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
