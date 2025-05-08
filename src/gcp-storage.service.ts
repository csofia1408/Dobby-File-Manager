import { Injectable, NotFoundException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { GCP_CONFIG } from './config/constants';
import { UploadFileDTO } from './dtos/documents.dto';
import { Response } from 'express';

@Injectable()
export class GcpStorageService {
  private readonly storage = new Storage({
    projectId: GCP_CONFIG.PROJECT_ID,
    keyFilename: GCP_CONFIG.KEY_FILENAME,
  });

  private readonly bucketName = GCP_CONFIG.BUCKET_NAME;

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

    console.log(`Carpeta creada en la ruta: ${folderPath}`);
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
}
