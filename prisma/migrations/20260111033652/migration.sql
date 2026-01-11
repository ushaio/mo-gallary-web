/*
  Warnings:

  - You are about to drop the column `lens` on the `Photo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "lens",
ADD COLUMN     "cameraId" TEXT,
ADD COLUMN     "lensId" TEXT,
ADD COLUMN     "lensModel" TEXT;

-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lens" (
    "id" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Camera_make_idx" ON "Camera"("make");

-- CreateIndex
CREATE UNIQUE INDEX "Camera_make_model_key" ON "Camera"("make", "model");

-- CreateIndex
CREATE INDEX "Lens_make_idx" ON "Lens"("make");

-- CreateIndex
CREATE UNIQUE INDEX "Lens_make_model_key" ON "Lens"("make", "model");

-- CreateIndex
CREATE INDEX "Photo_cameraId_idx" ON "Photo"("cameraId");

-- CreateIndex
CREATE INDEX "Photo_lensId_idx" ON "Photo"("lensId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_lensId_fkey" FOREIGN KEY ("lensId") REFERENCES "Lens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
