import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Supabase Storage uses S3-compatible API
const supabaseStorageClient = new S3Client({
  region: process.env.SUPABASE_STORAGE_REGION || 'us-west-2',
  endpoint: process.env.SUPABASE_STORAGE_ENDPOINT || 'https://ppfgonxjzuesetskxxei.storage.supabase.co/storage/v1/s3',
  credentials: {
    accessKeyId: process.env.SUPABASE_STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.SUPABASE_STORAGE_SECRET_KEY || '',
  },
  forcePathStyle: true, // Required for S3-compatible APIs
});

export class SupabaseStorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
    if (!process.env.SUPABASE_STORAGE_ACCESS_KEY || !process.env.SUPABASE_STORAGE_SECRET_KEY) {
      throw new Error('Supabase Storage credentials are required (SUPABASE_STORAGE_ACCESS_KEY, SUPABASE_STORAGE_SECRET_KEY)');
    }
  }

  async getUploadURL(fileType?: string): Promise<{ uploadURL: string; objectPath: string }> {
    try {
      const key = `uploads/${uuidv4()}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: fileType || 'application/octet-stream',
      });

      const uploadURL = await getSignedUrl(supabaseStorageClient, command, { expiresIn: 900 }); // 15 minutes

      return {
        uploadURL,
        objectPath: key,
      };
    } catch (error: any) {
      console.error('Supabase Storage upload URL generation failed:', error);
      throw new Error(`Failed to generate upload URL: ${error?.message || 'Unknown error'}`);
    }
  }

  async getDownloadURL(objectPath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectPath,
      });

      return await getSignedUrl(supabaseStorageClient, command, { expiresIn });
    } catch (error: any) {
      console.error('Supabase Storage download URL generation failed:', error);
      throw new Error(`Failed to generate download URL: ${error?.message || 'Unknown error'}`);
    }
  }

  getPublicURL(objectPath: string): string {
    // Supabase public URLs format: https://<project-id>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const endpoint = process.env.SUPABASE_STORAGE_ENDPOINT || 'https://ppfgonxjzuesetskxxei.storage.supabase.co';
    const projectId = endpoint.match(/https?:\/\/([^.]+)\.storage\.supabase\.co/)?.[1] || 'ppfgonxjzuesetskxxei';
    return `https://${projectId}.supabase.co/storage/v1/object/public/${this.bucketName}/${objectPath}`;
  }
}

// Backward compatibility alias
export const AWSStorageService = SupabaseStorageService;