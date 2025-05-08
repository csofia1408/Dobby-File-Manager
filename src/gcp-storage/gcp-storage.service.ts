import { Injectable, NotFoundException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { UploadFileDTO } from '../dtos/documents.dto';
import { Response } from 'express';

@Injectable()
export class GcpStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.bucketName =
      process.env.GCS_BUCKET_NAME ||
      (() => {
        throw new Error(
          'GCS_BUCKET_NAME is not defined in environment variables',
        );
      })();
  }
  private getFolderPath(idCitizen: string): string {
    return `${idCitizen}/`;
  }
  async createCitizenFolder(idCitizen: string): Promise<string> {
    const folderPath = this.getFolderPath(idCitizen);
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(`${folderPath}.init`);

    await file.save('', {
      contentType: 'application/x-empty',
    });

    console.log(`Folder created at path: ${folderPath}`);
    return `https://storage.googleapis.com/${this.bucketName}/${folderPath}`;
  }
  async uploadFileWithMetadata(
    file: Express.Multer.File,
    idCitizen: string,
    metadata: UploadFileDTO,
  ): Promise<string> {
    const folderPath = this.getFolderPath(idCitizen);
    const objectName = `${folderPath}${file.originalname}`;
    const bucket = this.storage.bucket(this.bucketName);
    const [filesInFolder] = await bucket.getFiles({ prefix: folderPath });
    if (!filesInFolder || filesInFolder.length === 0) {
      throw new NotFoundException(
        `Folder not found for citizen with ID ${idCitizen}`,
      );
    }
    const blob = bucket.file(objectName);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        metadata: {
          operatorId: metadata.operatorId || '',
          fileName: metadata.fileName,
          mimetype: metadata.mimetype,
          size: metadata.size.toString(),
          citizenId: idCitizen,
          isSign: 'false',
        },
      },
    });

    return `https://storage.googleapis.com/${this.bucketName}/${objectName}`;
  }

  async signFileByName(idCitizen: string, fileName: string): Promise<void> {
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
    sourceCitizenId: string,
    targetCitizenId: string,
    fileNames: string[],
  ): Promise<string[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const copiedFileUrls: string[] = [];

    const sourceFolderPath = this.getFolderPath(sourceCitizenId);
    const [sourceFolderFiles] = await bucket.getFiles({
      prefix: sourceFolderPath,
    });
    if (!sourceFolderFiles || sourceFolderFiles.length === 0) {
      throw new NotFoundException(
        `Source folder not found for citizen with ID ${sourceCitizenId}`,
      );
    }

    const targetFolderPath = this.getFolderPath(targetCitizenId);
    const [targetFolderFiles] = await bucket.getFiles({
      prefix: targetFolderPath,
    });
    if (!targetFolderFiles || targetFolderFiles.length === 0) {
      throw new NotFoundException(
        `Target folder not found for citizen with ID ${targetCitizenId}`,
      );
    }

    for (const fileName of fileNames) {
      const sourcePath = `${this.getFolderPath(sourceCitizenId)}${fileName}`;
      const targetPath = `${this.getFolderPath(targetCitizenId)}${fileName}`;

      const sourceFile = bucket.file(sourcePath);
      const targetFile = bucket.file(targetPath);

      const [fileExists] = await sourceFile.exists();
      if (!fileExists) {
        throw new NotFoundException(
          `File "${fileName}" not found in source folder for citizen with ID ${sourceCitizenId}`,
        );
      }

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
    idCitizen: string,
    fileName: string,
    res: Response,
  ): Promise<void> {
    const folderPath = `${this.getFolderPath(idCitizen)}${fileName}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(folderPath);
    const [exists] = await file.exists();
    if (!exists) {
      throw new NotFoundException(
        `File "${fileName}" not found for citizen with ID ${idCitizen}`,
      );
    }
    const [metadata] = await file.getMetadata();

    res.set({
      'Content-Type': metadata.contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
    });

    file.createReadStream().pipe(res);
  }
  async listDocuments(idCitizen: string): Promise<any[]> {
    const folderPrefix = this.getFolderPath(idCitizen);
    const bucket = this.storage.bucket(this.bucketName);

    const [files] = await bucket.getFiles({ prefix: folderPrefix });
    if (!files || files.length === 0) {
      throw new NotFoundException(
        `No folder found for citizen with ID ${idCitizen}`,
      );
    }
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
  async deleteFile(idCitizen: string, fileName: string): Promise<void> {
    const filePath = `${this.getFolderPath(idCitizen)}${fileName}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new NotFoundException(
        `File "${fileName}" not found for citizen with ID ${idCitizen}`,
      );
    }

    await file.delete();
  }
}
