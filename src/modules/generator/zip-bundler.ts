import fs from "fs";
import path from "path";
import zlib from "zlib";

// Precomputed CRC32 table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  relativePath: string;
  data: Buffer;
  compressedData: Buffer;
  crc: number;
  uncompressedSize: number;
  compressedSize: number;
  offset: number;
}

export class ZipBundler {
  /**
   * Recursively reads a directory and packages all files into a standard .zip archive buffer or file.
   */
  public static createZipFromDirectory(sourceDir: string, targetZipPath: string): void {
    const entries: ZipEntry[] = [];
    const baseDir = path.resolve(sourceDir);

    function walkDir(currentDir: string) {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (stat.isFile()) {
          const rawData = fs.readFileSync(fullPath);
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
          const compressed = zlib.deflateRawSync(rawData);
          const crc = crc32(rawData);

          // Use compression only if it actually reduces size
          const useDeflate = compressed.length < rawData.length;
          const finalData = useDeflate ? compressed : rawData;

          entries.push({
            relativePath,
            data: rawData,
            compressedData: finalData,
            crc,
            uncompressedSize: rawData.length,
            compressedSize: finalData.length,
            offset: 0,
          });
        }
      }
    }

    walkDir(baseDir);

    // Build the zip binary stream
    const chunks: Buffer[] = [];
    let currentOffset = 0;

    // 1. Write Local File Headers + File Data
    for (const entry of entries) {
      entry.offset = currentOffset;
      const nameBuf = Buffer.from(entry.relativePath, "utf8");
      const isDeflated = entry.compressedData.length < entry.uncompressedSize;
      const compressionMethod = isDeflated ? 8 : 0; // 8 = Deflate, 0 = Store

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
      localHeader.writeUInt16LE(20, 4);         // Version needed to extract (2.0)
      localHeader.writeUInt16LE(0, 6);          // General purpose bit flag
      localHeader.writeUInt16LE(compressionMethod, 8); // Compression method
      localHeader.writeUInt16LE(0, 10);         // Last mod file time
      localHeader.writeUInt16LE(0, 12);         // Last mod file date
      localHeader.writeUInt32LE(entry.crc, 14);  // CRC-32
      localHeader.writeUInt32LE(entry.compressedSize, 18);   // Compressed size
      localHeader.writeUInt32LE(entry.uncompressedSize, 22); // Uncompressed size
      localHeader.writeUInt16LE(nameBuf.length, 26);         // File name length
      localHeader.writeUInt16LE(0, 28);                      // Extra field length

      chunks.push(localHeader, nameBuf, entry.compressedData);
      currentOffset += localHeader.length + nameBuf.length + entry.compressedData.length;
    }

    const centralDirStartOffset = currentOffset;

    // 2. Write Central Directory Headers
    let centralDirSize = 0;
    for (const entry of entries) {
      const nameBuf = Buffer.from(entry.relativePath, "utf8");
      const isDeflated = entry.compressedData.length < entry.uncompressedSize;
      const compressionMethod = isDeflated ? 8 : 0;

      const cdHeader = Buffer.alloc(46);
      cdHeader.writeUInt32LE(0x02014b50, 0); // Central directory file header signature
      cdHeader.writeUInt16LE(20, 4);         // Version made by
      cdHeader.writeUInt16LE(20, 6);         // Version needed to extract
      cdHeader.writeUInt16LE(0, 8);          // General purpose bit flag
      cdHeader.writeUInt16LE(compressionMethod, 10);
      cdHeader.writeUInt16LE(0, 12);         // Last mod time
      cdHeader.writeUInt16LE(0, 14);         // Last mod date
      cdHeader.writeUInt32LE(entry.crc, 16);
      cdHeader.writeUInt32LE(entry.compressedSize, 20);
      cdHeader.writeUInt32LE(entry.uncompressedSize, 24);
      cdHeader.writeUInt16LE(nameBuf.length, 28);
      cdHeader.writeUInt16LE(0, 30);         // Extra field length
      cdHeader.writeUInt16LE(0, 32);         // File comment length
      cdHeader.writeUInt16LE(0, 34);         // Disk number start
      cdHeader.writeUInt16LE(0, 36);         // Internal file attributes
      cdHeader.writeUInt32LE(0, 38);         // External file attributes
      cdHeader.writeUInt32LE(entry.offset, 42); // Relative offset of local header

      chunks.push(cdHeader, nameBuf);
      centralDirSize += cdHeader.length + nameBuf.length;
    }

    // 3. Write End of Central Directory Record (EOCD)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
    eocd.writeUInt16LE(0, 4);          // Number of this disk
    eocd.writeUInt16LE(0, 6);          // Disk where central directory starts
    eocd.writeUInt16LE(entries.length, 8);  // Number of central directory records on this disk
    eocd.writeUInt16LE(entries.length, 10); // Total number of central directory records
    eocd.writeUInt32LE(centralDirSize, 12); // Size of central directory
    eocd.writeUInt32LE(centralDirStartOffset, 16); // Offset of start of central directory
    eocd.writeUInt16LE(0, 20);         // ZIP comment length

    chunks.push(eocd);

    const fullZip = Buffer.concat(chunks);
    fs.mkdirSync(path.dirname(targetZipPath), { recursive: true });
    fs.writeFileSync(targetZipPath, fullZip);
  }
}
