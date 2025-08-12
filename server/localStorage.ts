import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export class LocalStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir().catch(console.error);
  }

  private async ensureUploadDir() {
    try {
      if (!existsSync(this.uploadDir)) {
        await mkdir(this.uploadDir, { recursive: true });
        console.log(`Created upload directory: ${this.uploadDir}`);
      }
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      throw error;
    }
  }

  async saveFile(buffer: Buffer, mimeType: string): Promise<{ objectPath: string; publicURL: string }> {
    console.log("🔄 LocalStorageService: Saving file", {
      bufferSize: buffer.length,
      mimeType,
      uploadsDir: this.uploadsDir
    });

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const extension = mimeType.includes('jpeg') || mimeType.includes('jpg') ? '.jpg' : 
                     mimeType.includes('png') ? '.png' : 
                     mimeType.includes('gif') ? '.gif' : '';
    const fullFileName = fileName + extension;
    const filePath = path.join(this.uploadDir, fullFileName);

    console.log("📁 LocalStorageService: File details", {
      fileName,
      extension,
      fullFileName,
      filePath
    });

    await writeFile(filePath, buffer);
    console.log("✅ LocalStorageService: File written successfully");

    const publicURL = `/api/files/${fullFileName}`;
    const result = { objectPath: fullFileName, publicURL };

    console.log("✅ LocalStorageService: Result", result);
    return result;
  }

  getLocalPath(fileName: string): string {
    // Sanitize filename to prevent directory traversal
    const sanitizedFileName = path.basename(fileName);
    return path.join(this.uploadDir, sanitizedFileName);
  }
}