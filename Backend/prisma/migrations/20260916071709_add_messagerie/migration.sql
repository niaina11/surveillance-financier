-- AlterEnum
ALTER TYPE "TypeNotification" ADD VALUE 'MODIFICATION';

-- CreateTable
CREATE TABLE "Conversation" (
    "id_conversation" SERIAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PRIVE',
    "nom" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id_conversation")
);

-- CreateTable
CREATE TABLE "ParticipantConversation" (
    "id" SERIAL NOT NULL,
    "id_conversation" INTEGER NOT NULL,
    "id_utilisateur" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id_message" SERIAL NOT NULL,
    "id_conversation" INTEGER NOT NULL,
    "id_expediteur" TEXT NOT NULL,
    "contenu" TEXT,
    "fichier_url" TEXT,
    "fichier_nom" TEXT,
    "fichier_type" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id_message")
);

-- AddForeignKey
ALTER TABLE "ParticipantConversation" ADD CONSTRAINT "ParticipantConversation_id_conversation_fkey" FOREIGN KEY ("id_conversation") REFERENCES "Conversation"("id_conversation") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantConversation" ADD CONSTRAINT "ParticipantConversation_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_id_conversation_fkey" FOREIGN KEY ("id_conversation") REFERENCES "Conversation"("id_conversation") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_id_expediteur_fkey" FOREIGN KEY ("id_expediteur") REFERENCES "Utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;
