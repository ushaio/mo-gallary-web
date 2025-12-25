-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Blog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '未分类',
    "tags" TEXT NOT NULL DEFAULT '',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Blog" ("content", "createdAt", "id", "isPublished", "title", "updatedAt") SELECT "content", "createdAt", "id", "isPublished", "title", "updatedAt" FROM "Blog";
DROP TABLE "Blog";
ALTER TABLE "new_Blog" RENAME TO "Blog";
CREATE INDEX "Blog_isPublished_idx" ON "Blog"("isPublished");
CREATE INDEX "Blog_createdAt_idx" ON "Blog"("createdAt");
CREATE INDEX "Blog_category_idx" ON "Blog"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
