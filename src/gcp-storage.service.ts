import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { GCP_CONFIG } from './config/constants';

@Injectable()
export class GcpStorageService {
  private readonly storage = new Storage({
    projectId: GCP_CONFIG.PROJECT_ID,
    keyFilename: GCP_CONFIG.KEY_FILENAME,
  });
  private readonly bucketName = GCP_CONFIG.BUCKET_NAME;

  private getFolderPath(idCitizen: number): string {
    return `${idCitizen}/`;
  }

  async uploadFile(
    file: Express.Multer.File,
    idCitizen: number,
  ): Promise<string> {
    const folderPath = this.getFolderPath(idCitizen);
    const objectName = `${folderPath}${file.originalname}`;
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(objectName);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        metadata: {
          originalname: file.originalname,
          citizenId: idCitizen.toString(),
        },
      },
    });

    return `https://storage.googleapis.com/${this.bucketName}/${objectName}`;
  }

  async listDocuments(idCitizen: number): Promise<any[]> {
    const folderPrefix = this.getFolderPath(idCitizen);
    const bucket = this.storage.bucket(this.bucketName);

    const [files] = await bucket.getFiles({
      prefix: folderPrefix,
    });

    return files.map((file) => ({
      url: `https://storage.googleapis.com/${this.bucketName}/${file.name}`,
      name: file.name.split('/').pop(),
      size: file.metadata.size,
      lastModified: file.metadata.updated,
      contentType: file.metadata.contentType,
    }));
  }
}
