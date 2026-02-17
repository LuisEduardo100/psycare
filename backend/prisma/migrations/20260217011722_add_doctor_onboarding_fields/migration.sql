/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reset_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "certificate_serial" TEXT,
ADD COLUMN     "clinic_address" JSONB,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarding_status" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reset_expires" TIMESTAMP(3),
ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "rqe" TEXT,
ADD COLUMN     "validation_level" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_token_key" ON "users"("reset_token");
