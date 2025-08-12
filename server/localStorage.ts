
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

  async saveFile(buffer: Buffer, fileType?: string): Promise<{ objectPath: string; publicURL: string }> {
    try {
      await this.ensureUploadDir();
      
      const fileName = `${randomUUID()}`;
      const filePath = path.join(this.uploadDir, fileName);
      
      await writeFile(filePath, buffer);
      
      const objectPath = `uploads/${fileName}`;
      const publicURL = `/api/files/${fileName}`;
      
      console.log(`File saved locally: ${fileName}`);
      return { objectPath, publicURL };
    } catch (error) {
      console.error('Failed to save file locally:', error);
      throw error;
    }
  }

  getLocalPath(fileName: string): string {
    // Sanitize filename to prevent directory traversal
    const sanitizedFileName = path.basename(fileName);
    return path.join(this.uploadDir, sanitizedFileName);
  }
}
