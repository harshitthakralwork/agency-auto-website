# Complete Cinematic Experience Engine (Phase 2.3)
## Production-Ready Architecture & Developer Documentation

The **Cinematic Experience Engine** is the motion and video orchestration layer of the Agency Website Engine. It powers high-performance scroll reveals, pinned storytelling timelines, multi-layer parallax, and hardware-accelerated HTML5 Canvas frame-sequence scrub playback.

---

## 1. Engine Architecture

The cinematic system follows a modular architecture under `src/modules/cinematic/` and reusable UI components under `src/components/cinematic/`:

```
src/
├── modules/
│   └── cinematic/
│       ├── core/                  # Engine initialization & lifecycle
│       ├── gsap/                  # GSAP & ScrollTrigger plugins, reduced-motion detection
│       ├── scroll/                # Reusable animation patterns (Reveal, Pinned, Parallax, Text, Horizontal)
│       ├── canvas/                # HTML5 Canvas renderer with DPI scaling and LRU cache
│       ├── frames/                # Manifest serialization, validation and loading
│       ├── video/                 # FFprobe metadata inspection, FFmpeg extraction, Sharp WebP compression
│       ├── performance/           # Performance budgets, DPR clamps, mobile detection
│       ├── accessibility/         # prefers-reduced-motion fallbacks
│       ├── registry/              # Pattern definitions and metadata
│       └── types/                 # Shared TypeScript interfaces
└── components/
    └── cinematic/
        ├── CanvasFrameSequence.tsx     # Pinned/unpinned Canvas frame scrub component
        ├── ScrollReveal.tsx            # GSAP ScrollTrigger reveal wrapper
        ├── ParallaxSection.tsx         # Multi-layer parallax scroll controller
        ├── PinnedStorySection.tsx      # Multi-step pinned storytelling experience
        ├── HorizontalScrollGallery.tsx # Vertical-to-horizontal gallery travel
        ├── ScrollTextSequence.tsx      # Staggered word/headline storytelling
        ├── CinematicHero.tsx           # Full-bleed cinematic hero section
        └── CinematicMediaSection.tsx   # Reusable cinematic media section
```

---

## 2. Windows FFmpeg & FFprobe Setup

The engine relies on `ffmpeg` and `ffprobe` for video inspection and frame extraction.

### Automatic Windows Installation via WinGet (Recommended)
```powershell
winget install Gyan.FFmpeg
```

Verify installation in PowerShell:
```powershell
ffmpeg -version
ffprobe -version
```

### Manual Installation
1. Download Gyan's Full Build from [gyan.dev/ffmpeg/builds](https://www.gyan.dev/ffmpeg/builds/).
2. Extract the archive (e.g., to `C:\ffmpeg`).
3. Add `C:\ffmpeg\bin` to your System `PATH` environment variable.
4. Open a new PowerShell terminal to verify `Get-Command ffmpeg`.

---

## 3. Video-to-Frame Processing Workflow

When an agency operator uploads an MP4 or WebM video to the Media Studio:

```
Uploaded Video (MP4 / WebM)
          │
          ▼
1. Validation (MIME, Extension, File Size, Directory Boundary)
          │
          ▼
2. FFprobe Metadata Inspection (Duration, FPS, Resolution, Codec)
          │
          ▼
3. FFmpeg Extraction (Target FPS 12/24/30, Max Frames 30-240)
          │
          ▼
4. Sharp WebP Compression (High: 85%, Medium: 75%, Low: 60%)
          │
          ▼
5. Poster Extraction (First frame converted to poster.webp)
          │
          ▼
6. Frame Manifest Creation (manifest.json with ordered frames)
          │
          ▼
7. SQLite ProjectAsset Creation (assetType: "FRAME_SEQUENCE", slot: "CANVAS_HERO_SEQUENCE")
          │
          ▼
8. HTML5 Canvas Scrub Playback (CanvasFrameRenderer & ScrollTrigger)
```

### Queue Management
Jobs are tracked in SQLite via the `VideoProcessingJob` model:
- `QUEUED`: Job registered, waiting for thread worker.
- `PROCESSING`: FFmpeg extracting and Sharp compressing frames.
- `COMPLETED`: Frames and `manifest.json` written, `ProjectAsset` record created.
- `FAILED`: Failure reason captured in `errorMessage`, temporary files deleted.
- `CANCELLED`: Interrupted by operator, partial files cleaned up.

---

## 4. Frame Manifest Format

The manifest is stored at `/uploads/projects/[id]/frames/[jobId]/manifest.json`:

```json
{
  "version": "1.0",
  "id": "job_c1234567890",
  "projectId": "proj_123",
  "sourceVideoName": "aerial_hotel.mp4",
  "sourceVideoUrl": "/uploads/projects/proj_123/aerial_hotel.mp4",
  "fps": 24,
  "frameCount": 60,
  "duration": 2.5,
  "width": 1920,
  "height": 1080,
  "format": "webp",
  "fitMode": "cover",
  "posterUrl": "/uploads/projects/proj_123/frames/job_c1234567890/poster.webp",
  "frames": [
    {
      "index": 0,
      "url": "/uploads/projects/proj_123/frames/job_c1234567890/frame_0000.webp",
      "filename": "frame_0000.webp"
    },
    ...
  ],
  "createdAt": "2026-11-03T01:30:00.000Z"
}
```

---

## 5. Adding New Animation Patterns

To add a new animation pattern:
1. Define the pattern configuration in `src/modules/cinematic/types/index.ts`.
2. Register the pattern definition in `src/modules/cinematic/registry/index.ts`.
3. Implement the GSAP ScrollTrigger logic in `src/modules/cinematic/scroll/triggers.ts`.
4. Wrap in a React component in `src/components/cinematic/` using the `useGSAP` hook.

---

## 6. Accessibility & Reduced Motion

Every cinematic component automatically detects user preferences:
- `prefers-reduced-motion: reduce`:
  - Canvas scrubbing is suspended; the first frame or poster is displayed statically.
  - Scroll reveals immediately set opacity to 1 with zero translation offsets.
  - Pinned story sections render without scroll-locking.
  - Horizontal scroll galleries convert to touch-scrollable flex containers.

---

## 7. Performance & Memory Safeguards

- **Bounded LRU Cache**: Memory is limited to 40 frames at a time (`FrameCache`). Frames outside the current viewport scrub window are automatically released.
- **DPI Clamping**: High-DPI screens are clamped to `devicePixelRatio <= 2` to prevent 4K/8K frame buffers from exhausting mobile memory.
- **Priority Preloading**: Initial 5 frames are loaded immediately; subsequent frames are loaded in a sliding window as the user scrolls.
