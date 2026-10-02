/*
  Warnings:

  - Added the required column `nom_client` to the `Operation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prenom_client` to the `Operation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Operation" ADD COLUMN     "nom_client" TEXT NOT NULL,
ADD COLUMN     "numero_client" TEXT,
ADD COLUMN     "prenom_client" TEXT NOT NULL;
