-- CreateTable
CREATE TABLE "improvement_upvotes" (
    "id" TEXT NOT NULL,
    "improvementId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "improvement_upvotes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "improvement_upvotes" ADD CONSTRAINT "improvement_upvotes_improvementId_fkey" FOREIGN KEY ("improvementId") REFERENCES "improvement_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
