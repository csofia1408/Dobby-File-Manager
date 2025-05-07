import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { GCP_CONFIG } from './config/constants';
import { UploadFileDTO } from './dtos/documents.dto';
import { GetSignedUrlConfig } from '@google-cloud/storage';
import { Response } from 'express';

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
  async createCitizenFolder(idCitizen: number): Promise<string> {
    const folderPath = this.getFolderPath(idCitizen);
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(`${folderPath}.init`);

    await file.save('', {
      contentType: 'application/x-empty',
    });

    console.log(`Carpeta creada en la ruta: ${folderPath}`);
    return `https://storage.googleapis.com/${this.bucketName}/${folderPath}`;
  }
  async uploadFileWithMetadata(
    file: Express.Multer.File,
    idCitizen: number,
    metadata: UploadFileDTO,
  ): Promise<string> {
    const folderPath = this.getFolderPath(idCitizen);
    const objectName = `${folderPath}${file.originalname}`;
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(objectName);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        metadata: {
          operatorId: metadata.operatorId || '',
          fileName: metadata.fileName,
          mimetype: metadata.mimetype,
          size: metadata.size.toString(),
          citizenId: idCitizen.toString(),
          isSign: 'false',
        },
      },
    });

    return `https://storage.googleapis.com/${this.bucketName}/${objectName}`;
  }
  async getSignedUrl(
    idCitizen: number,
    fileName: string,
    expiresInSeconds = 60 * 10,
  ): Promise<string> {
    const filePath = `${this.getFolderPath(idCitizen)}${fileName}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    const options: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInSeconds * 1000,
    };

    const [url] = await file.getSignedUrl(options);
    return url;
  }
  async signFileByName(idCitizen: number, fileName: string): Promise<void> {
    const folderPath = this.getFolderPath(idCitizen);
    const filePath = `${folderPath}${fileName}`;
    await this.signFile(filePath);
  }
  async signFile(filePath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    const [metadata] = await file.getMetadata();

    const existingMetadata = metadata.metadata || {};

    await file.setMetadata({
      metadata: {
        ...existingMetadata,
        isSign: 'true',
      },
    });
  }
  async transferFilesBetweenFolders(
    sourceCitizenId: number,
    targetCitizenId: number,
    fileNames: string[],
  ): Promise<string[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const copiedFileUrls: string[] = [];

    for (const fileName of fileNames) {
      const sourcePath = `${this.getFolderPath(sourceCitizenId)}${fileName}`;
      const targetPath = `${this.getFolderPath(targetCitizenId)}${fileName}`;

      const sourceFile = bucket.file(sourcePath);
      const targetFile = bucket.file(targetPath);

      await sourceFile.copy(targetFile);

      const [metadata] = await sourceFile.getMetadata();
      const existingMetadata = metadata.metadata || {};

      await targetFile.setMetadata({
        metadata: {
          ...existingMetadata,
          citizenId: targetCitizenId.toString(),
        },
      });

      copiedFileUrls.push(
        `https://storage.googleapis.com/${this.bucketName}/${targetPath}`,
      );
    }

    return copiedFileUrls;
  }
  async streamFileToResponse(
    idCitizen: number,
    fileName: string,
    res: Response,
  ): Promise<void> {
    const folderPath = `${this.getFolderPath(idCitizen)}${fileName}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(folderPath);

    const [metadata] = await file.getMetadata();

    res.set({
      'Content-Type': metadata.contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
    });

    file.createReadStream().pipe(res);
  }
  async listDocuments(idCitizen: number): Promise<any[]> {
    const folderPrefix = this.getFolderPath(idCitizen);
    const bucket = this.storage.bucket(this.bucketName);

    const [files] = await bucket.getFiles({ prefix: folderPrefix });

    return files
      .filter((file) => !file.name.endsWith('.init'))
      .map((file) => {
        const name = file.name.split('/').pop();
        return {
          name,
          size: file.metadata.size,
          lastModified: file.metadata.updated,
          contentType: file.metadata.contentType,
          metadata: file.metadata.metadata,
          backendUrl: `/download-file/${idCitizen}/${name}`,
        };
      });
  }
}
