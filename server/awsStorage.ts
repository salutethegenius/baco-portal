import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export class AWSStorageService {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET!;
    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }
  }

  async getUploadURL(fileType?: string): Promise<{ uploadURL: string; objectPath: string }> {
    const key = `uploads/${uuidv4()}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType || 'application/octet-stream',
    });

    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes

    return {
      uploadURL,
      objectPath: key,
    };
  }

  getPublicURL(objectPath: string): string {
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectPath}`;
  }
}