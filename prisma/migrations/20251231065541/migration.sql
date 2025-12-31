-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "coverPhotoId" TEXT;

-- CreateIndex
CREATE INDEX "Story_coverPhotoId_idx" ON "Story"("coverPhotoId");
