/*
  Warnings:

  - Changed the type of `statut` on the `Alerte` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Alerte" DROP COLUMN "statut",
ADD COLUMN     "statut" TEXT NOT NULL;
