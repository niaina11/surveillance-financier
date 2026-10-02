/*
  Warnings:

  - The primary key for the `Conversation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ParticipantConversation` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_id_conversation_fkey";

-- DropForeignKey
ALTER TABLE "ParticipantConversation" DROP CONSTRAINT "ParticipantConversation_id_conversation_fkey";

-- AlterTable
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_pkey",
ALTER COLUMN "id_conversation" DROP DEFAULT,
ALTER COLUMN "id_conversation" SET DATA TYPE TEXT,
ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id_conversation");
DROP SEQUENCE "Conversation_id_conversation_seq";

-- AlterTable
ALTER TABLE "Message" DROP CONSTRAINT "Message_pkey",
ALTER COLUMN "id_message" DROP DEFAULT,
ALTER COLUMN "id_message" SET DATA TYPE TEXT,
ALTER COLUMN "id_conversation" SET DATA TYPE TEXT,
ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("id_message");
DROP SEQUENCE "Message_id_message_seq";

-- AlterTable
ALTER TABLE "ParticipantConversation" DROP CONSTRAINT "ParticipantConversation_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "id_conversation" SET DATA TYPE TEXT,
ADD CONSTRAINT "ParticipantConversation_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ParticipantConversation_id_seq";

-- AddForeignKey
ALTER TABLE "ParticipantConversation" ADD CONSTRAINT "ParticipantConversation_id_conversation_fkey" FOREIGN KEY ("id_conversation") REFERENCES "Conversation"("id_conversation") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_id_conversation_fkey" FOREIGN KEY ("id_conversation") REFERENCES "Conversation"("id_conversation") ON DELETE RESTRICT ON UPDATE CASCADE;
