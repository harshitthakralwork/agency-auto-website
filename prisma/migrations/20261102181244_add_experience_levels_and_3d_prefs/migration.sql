-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL DEFAULT 'CINEMATIC',
    "location" TEXT,
    "description" TEXT,
    "services" TEXT NOT NULL DEFAULT '',
    "targetAudience" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("category", "createdAt", "description", "id", "location", "name", "services", "slug", "status", "targetAudience", "updatedAt") SELECT "category", "createdAt", "description", "id", "location", "name", "services", "slug", "status", "targetAudience", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
CREATE INDEX "Project_category_idx" ON "Project"("category");
CREATE INDEX "Project_experienceLevel_idx" ON "Project"("experienceLevel");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE TABLE "new_ProjectDesignConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL DEFAULT 'CINEMATIC',
    "preset" TEXT NOT NULL DEFAULT 'cinematic',
    "primaryColor" TEXT NOT NULL DEFAULT '#0f172a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "accentColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "surfaceColor" TEXT NOT NULL DEFAULT '#f8fafc',
    "textColor" TEXT NOT NULL DEFAULT '#0f172a',
    "mutedTextColor" TEXT NOT NULL DEFAULT '#64748b',
    "headingFont" TEXT NOT NULL DEFAULT 'Inter',
    "bodyFont" TEXT NOT NULL DEFAULT 'Inter',
    "baseFontSize" TEXT NOT NULL DEFAULT '16px',
    "layoutStyle" TEXT NOT NULL DEFAULT 'modern-contained',
    "borderRadius" TEXT NOT NULL DEFAULT '0.5rem',
    "containerWidth" TEXT NOT NULL DEFAULT '1280px',
    "animationIntensity" TEXT NOT NULL DEFAULT 'cinematic',
    "enableCanvasFx" BOOLEAN NOT NULL DEFAULT false,
    "mediaPreferences" TEXT NOT NULL DEFAULT '{}',
    "threeDPreferences" TEXT NOT NULL DEFAULT '{}',
    "sectionsConfigJson" TEXT NOT NULL DEFAULT '[]',
    "responsiveSettings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectDesignConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProjectDesignConfig" ("accentColor", "animationIntensity", "backgroundColor", "baseFontSize", "bodyFont", "borderRadius", "containerWidth", "createdAt", "enableCanvasFx", "headingFont", "id", "layoutStyle", "mutedTextColor", "preset", "primaryColor", "projectId", "responsiveSettings", "secondaryColor", "sectionsConfigJson", "surfaceColor", "textColor", "updatedAt") SELECT "accentColor", "animationIntensity", "backgroundColor", "baseFontSize", "bodyFont", "borderRadius", "containerWidth", "createdAt", "enableCanvasFx", "headingFont", "id", "layoutStyle", "mutedTextColor", "preset", "primaryColor", "projectId", "responsiveSettings", "secondaryColor", "sectionsConfigJson", "surfaceColor", "textColor", "updatedAt" FROM "ProjectDesignConfig";
DROP TABLE "ProjectDesignConfig";
ALTER TABLE "new_ProjectDesignConfig" RENAME TO "ProjectDesignConfig";
CREATE UNIQUE INDEX "ProjectDesignConfig_projectId_key" ON "ProjectDesignConfig"("projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
