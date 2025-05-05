// src/gcp-storage.service.ts
import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcpStorageService {
  private storage: Storage;
  private bucketName = 'dobby-file-manager';

  constructor() {
    this.storage = new Storage({
      projectId: 'winter-form-458923-n4',
      keyFilename: 'key-gcp.json',
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    idCitizen: number,
  ): Promise<string> {
    const folderPath = `${idCitizen}/`;
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
    const folderPrefix = `${idCitizen}/`;
    const bucket = this.storage.bucket(this.bucketName);

    const [files] = await bucket.getFiles({
      prefix: folderPrefix,
    });

    const result = files.map((file) => ({
      url: `https://storage.googleapis.com/${this.bucketName}/${file.name}`,
      name: file.name.split('/').pop(),
      size: file.metadata.size,
      lastModified: file.metadata.updated,
      contentType: file.metadata.contentType,
    }));

    return result;
  }
}
