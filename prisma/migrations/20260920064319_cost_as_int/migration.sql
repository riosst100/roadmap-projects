/*
  Warnings:

  - You are about to alter the column `cost` on the `RoadmapItem` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoadmapItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "cost" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoadmapItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoadmapItem" ("cost", "createdAt", "description", "id", "order", "priority", "projectId", "purpose", "status", "title", "updatedAt") SELECT "cost", "createdAt", "description", "id", "order", "priority", "projectId", "purpose", "status", "title", "updatedAt" FROM "RoadmapItem";
DROP TABLE "RoadmapItem";
ALTER TABLE "new_RoadmapItem" RENAME TO "RoadmapItem";
CREATE INDEX "RoadmapItem_projectId_idx" ON "RoadmapItem"("projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
