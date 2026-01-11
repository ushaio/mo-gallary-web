/*
  Warnings:

  - You are about to drop the column `make` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `make` on the `Lens` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Lens` table. All the data in the column will be lost.
  - Added the required column `name` to the `Camera` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Lens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Camera_make_idx";

-- DropIndex
DROP INDEX "Camera_make_model_key";

-- DropIndex
DROP INDEX "Lens_make_idx";

-- DropIndex
DROP INDEX "Lens_make_model_key";

-- AlterTable
ALTER TABLE "Camera" DROP COLUMN "make",
DROP COLUMN "model",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Lens" DROP COLUMN "make",
DROP COLUMN "model",
ADD COLUMN     "name" TEXT NOT NULL;
