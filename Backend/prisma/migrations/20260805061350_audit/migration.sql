/*
  Warnings:

  - Added the required column `module` to the `JournalAudit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JournalAudit" ADD COLUMN     "module" TEXT NOT NULL;
