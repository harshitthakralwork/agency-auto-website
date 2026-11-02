import ffmpeg from "fluent-ffmpeg";
import { VideoMetadata } from "../types";

export class VideoInspector {
  static async inspect(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          return reject(new Error(`FFprobe inspection failed: ${err.message}`));
        }

        if (!metadata || !metadata.streams) {
          return reject(new Error("FFprobe returned empty or invalid metadata"));
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === "video"
        );

        if (!videoStream) {
          return reject(new Error("No video stream found in the inspected media file"));
        }

        const duration = Number(metadata.format.duration || videoStream.duration || 0);
        const width = videoStream.width || 0;
        const height = videoStream.height || 0;
        const codec = videoStream.codec_name || "unknown";
        const format = metadata.format.format_name || "unknown";
        const sizeBytes = Number(metadata.format.size || 0);
        const bitrate = Number(metadata.format.bit_rate || 0);

        // Calculate actual frame rate from r_frame_rate e.g. "24/1" or "30000/1001"
        let fps = 24;
        if (videoStream.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split("/");
          if (parts.length === 2 && Number(parts[1]) > 0) {
            fps = Math.round(Number(parts[0]) / Number(parts[1]));
          } else {
            fps = Math.round(Number(videoStream.r_frame_rate)) || 24;
          }
        }

        if (duration <= 0) {
          return reject(new Error("Invalid video duration (zero or negative)"));
        }

        // Limit maximum duration to 180 seconds for cinematic frame sequence safety
        if (duration > 180) {
          return reject(
            new Error(`Video duration of ${Math.round(duration)}s exceeds the 180s limit for frame extraction`)
          );
        }

        resolve({
          duration,
          width,
          height,
          fps,
          codec,
          format,
          sizeBytes,
          bitrate,
        });
      });
    });
  }
}

