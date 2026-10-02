-- CreateEnum
CREATE TYPE "StatutUser" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REJETE');

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "statut" "StatutUser" NOT NULL DEFAULT 'EN_ATTENTE';
