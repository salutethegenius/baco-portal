
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export class LocalStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, fileType?: string): Promise<{ objectPath: string; publicURL: string }> {
    const fileName = `${randomUUID()}`;
    const filePath = path.join(this.uploadDir, fileName);
    
    await writeFile(filePath, buffer);
    
    const objectPath = `uploads/${fileName}`;
    const publicURL = `/api/files/${fileName}`;
    
    return { objectPath, publicURL };
  }

  getLocalPath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }
}
