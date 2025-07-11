-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Garden" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Garden" ("createdAt", "description", "id", "imageUrl", "latitude", "linkUrl", "longitude", "name", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "latitude", "linkUrl", "longitude", "name", "updatedAt" FROM "Garden";
DROP TABLE "Garden";
ALTER TABLE "new_Garden" RENAME TO "Garden";
CREATE TABLE "new_Hotspot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Hotspot" ("createdAt", "description", "id", "imageUrl", "latitude", "linkUrl", "longitude", "name", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "latitude", "linkUrl", "longitude", "name", "updatedAt" FROM "Hotspot";
DROP TABLE "Hotspot";
ALTER TABLE "new_Hotspot" RENAME TO "Hotspot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
