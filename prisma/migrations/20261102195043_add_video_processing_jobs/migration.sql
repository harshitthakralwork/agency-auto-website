-- CreateTable
CREATE TABLE "VideoProcessingJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "videoAssetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "progress" REAL NOT NULL DEFAULT 0.0,
    "targetFps" INTEGER NOT NULL DEFAULT 24,
    "maxFrames" INTEGER NOT NULL DEFAULT 60,
    "quality" TEXT NOT NULL DEFAULT 'high',
    "outputFormat" TEXT NOT NULL DEFAULT 'webp',
    "frameCount" INTEGER,
    "duration" REAL,
    "width" INTEGER,
    "height" INTEGER,
    "manifestUrl" TEXT,
    "manifestPath" TEXT,
    "errorMessage" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VideoProcessingJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoProcessingJob_videoAssetId_fkey" FOREIGN KEY ("videoAssetId") REFERENCES "ProjectAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VideoProcessingJob_projectId_idx" ON "VideoProcessingJob"("projectId");

-- CreateIndex
CREATE INDEX "VideoProcessingJob_videoAssetId_idx" ON "VideoProcessingJob"("videoAssetId");

-- CreateIndex
CREATE INDEX "VideoProcessingJob_status_idx" ON "VideoProcessingJob"("status");
