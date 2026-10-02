-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('OPERATION', 'ALERTE');

-- CreateTable
CREATE TABLE "Notification" (
    "id_notification" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "TypeOperation" NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "id_utilisateur" TEXT NOT NULL,
    "id_operation" TEXT,
    "id_alerte" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id_notification")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "Utilisateur"("id_utilisateur") ON DELETE RESTRICT ON UPDATE CASCADE;
