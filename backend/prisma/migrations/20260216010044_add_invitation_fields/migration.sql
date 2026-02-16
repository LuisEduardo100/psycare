/*
  Warnings:

  - A unique constraint covering the columns `[invite_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "daily_logs" ADD COLUMN     "anxiety_level" INTEGER,
ADD COLUMN     "irritability_level" INTEGER,
ADD COLUMN     "life_event_description" TEXT,
ADD COLUMN     "life_event_impact" INTEGER,
ADD COLUMN     "menstruation_stage" TEXT,
ADD COLUMN     "mood_level" INTEGER,
ADD COLUMN     "sleep_hours" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "patient_profiles" ADD COLUMN     "doctor_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "invite_expires" TIMESTAMP(3),
ADD COLUMN     "invite_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_invite_token_key" ON "users"("invite_token");

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
