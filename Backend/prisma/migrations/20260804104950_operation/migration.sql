/*
  Warnings:

  - Changed the type of `type_operation` on the `Operation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Operation" DROP COLUMN "type_operation",
ADD COLUMN     "type_operation" TEXT NOT NULL;
