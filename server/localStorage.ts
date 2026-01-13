import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export class LocalStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir().catch(() => {});
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, mimeType: string): Promise<{ objectPath: string; publicURL: string }> {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const extension = mimeType.includes('jpeg') || mimeType.includes('jpg') ? '.jpg' : 
                     mimeType.includes('png') ? '.png' : 
                     mimeType.includes('gif') ? '.gif' : '';
    const fullFileName = fileName + extension;
    const filePath = path.join(this.uploadDir, fullFileName);

    await writeFile(filePath, buffer);

    const publicURL = `/api/files/${fullFileName}`;
    return { objectPath: fullFileName, publicURL };
  }

  getLocalPath(fileName: string): string {
    // Sanitize filename to prevent directory traversal
    const sanitizedFileName = path.basename(fileName);
    return path.join(this.uploadDir, sanitizedFileName);
  }
}