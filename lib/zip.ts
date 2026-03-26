import archiver from "archiver";
import { PassThrough } from "node:stream";

interface ZipEntry {
  name: string;
  buffer: Buffer;
}

/**
 * Generates a ZIP file from an array of named buffers.
 * Returns the ZIP as a single Buffer.
 */
export async function generateZip(entries: ZipEntry[]): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    const passthrough = new PassThrough();

    passthrough.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    passthrough.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(passthrough);

    for (const entry of entries) {
      archive.append(entry.buffer, { name: entry.name });
    }

    archive.finalize();
  });
}
