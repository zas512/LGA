-- Multi-assignee tasks: join table replaces Task.assignedToId; createdById
-- renames assignedById; attachments gain kind/metadata + an uploader relation.

-- DropIndex
DROP INDEX "Task_assignedToId_status_dueDate_idx";

-- CreateEnum
CREATE TYPE "TaskAttachmentKind" AS ENUM ('FILE', 'LINK');

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "associateId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- Backfill: preserve each existing task's single assignee as a join row
-- (must run before assignedToId is dropped below).
INSERT INTO "TaskAssignee" ("id", "taskId", "associateId", "assignedAt")
SELECT gen_random_uuid(), "id", "assignedToId", now()
FROM "Task"
WHERE "assignedToId" IS NOT NULL;

-- AlterTable (add createdById, populate from assignedById, then NOT NULL)
ALTER TABLE "Task" ADD COLUMN "createdById" TEXT;
UPDATE "Task" SET "createdById" = "assignedById" WHERE "createdById" IS NULL;
ALTER TABLE "Task" ALTER COLUMN "createdById" SET NOT NULL;

-- AlterTable (attachment metadata + uploader)
ALTER TABLE "TaskAttachment" ADD COLUMN "kind" "TaskAttachmentKind" NOT NULL DEFAULT 'FILE';
ALTER TABLE "TaskAttachment" ADD COLUMN "fileName" TEXT;
ALTER TABLE "TaskAttachment" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "TaskAttachment" ADD COLUMN "cloudinaryPublicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_associateId_key" ON "TaskAssignee"("taskId", "associateId");

-- CreateIndex
CREATE INDEX "Task_createdById_status_dueDate_idx" ON "Task"("createdById", "status", "dueDate");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Associate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedById_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assignedById";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assignedToId";
