-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "TypeOperation" AS ENUM ('ENCAISSEMENT', 'DECAISSEMENT', 'TRANSFERT');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "StatutAlerte" AS ENUM ('NON_LUE', 'LUE', 'TRAITEE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id_utilisateur" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "mot_de_passe" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "id_agence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id_utilisateur")
);

-- CreateTable
CREATE TABLE "Agence" (
    "id_agence" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agence_pkey" PRIMARY KEY ("id_agence")
);

-- CreateTable
CREATE TABLE "Solde" (
    "id_solde" TEXT NOT NULL,
    "montant_actuel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL,
    "id_agence" TEXT NOT NULL,

    CONSTRAINT "Solde_pkey" PRIMARY KEY ("id_solde")
);

-- CreateTable
CREATE TABLE "ParametreAgence" (
    "id_parametre" TEXT NOT NULL,
    "fonds_minimum" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "fonds_maximum" DOUBLE PRECISION NOT NULL DEFAULT 1000000,
    "seuil_alerte" DOUBLE PRECISION NOT NULL DEFAULT 50000,
    "id_agence" TEXT NOT NULL,

    CONSTRAINT "ParametreAgence_pkey" PRIMARY KEY ("id_parametre")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id_operation" TEXT NOT NULL,
    "type_operation" "TypeOperation" NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date_operation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_agent" TEXT NOT NULL,
    "id_agence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id_operation")
);

-- CreateTable
CREATE TABLE "Demande" (
    "id_demande" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "montant_demande" DOUBLE PRECISION NOT NULL,
    "date_demande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "id_agent" TEXT NOT NULL,
    "id_agence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Demande_pkey" PRIMARY KEY ("id_demande")
);

-- CreateTable
CREATE TABLE "Alerte" (
    "id_alerte" TEXT NOT NULL,
    "type_alerte" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutAlerte" NOT NULL DEFAULT 'NON_LUE',
    "id_agence" TEXT NOT NULL,
    "id_operation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alerte_pkey" PRIMARY KEY ("id_alerte")
);

-- CreateTable
CREATE TABLE "JournalAudit" (
    "id_journal" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "date_action" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_utilisateur" TEXT NOT NULL,
    "id_agence" TEXT,

    CONSTRAINT "JournalAudit_pkey" PRIMARY KEY ("id_journal")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_telephone_key" ON "Utilisateur"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "Solde_id_agence_key" ON "Solde"("id_agence");

-- CreateIndex
CREATE UNIQUE INDEX "ParametreAgence_id_agence_key" ON "ParametreAgence"("id_agence");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "Agence"("id_agence") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solde" ADD CONSTRAINT "Solde_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "Agence"("id_agence") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParametreAgence" ADD CONSTRAINT "ParametreAgence_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "Agence"("id_agence") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_id_agent_fkey" FOREIGN KEY ("id_agent") REFERENCES "Utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "Agence"("id_agence") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demande" ADD CONSTRAINT "Demande_id_agent_fkey" FOREIGN KEY ("id_agent") REFERENCES "Utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demande" ADD CONSTRAINT "Demande_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "Agence"("id_agence") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerte" ADD CONSTRAINT "Alerte_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "Agence"("id_agence") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerte" ADD CONSTRAINT "Alerte_id_operation_fkey" FOREIGN KEY ("id_operation") REFERENCES "Operation"("id_operation") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalAudit" ADD CONSTRAINT "JournalAudit_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalAudit" ADD CONSTRAINT "JournalAudit_id_agence_fkey" FOREIGN KEY ("id_agence") REFERENCES "Agence"("id_agence") ON DELETE SET NULL ON UPDATE CASCADE;
