import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  Param,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GcpStorageService } from './gcp-storage.service';
import { IdCitizenDTO, UploadFileDTO } from './dtos/documents.dto';
import { Response } from 'express';

@Controller()
export class GcpUploadController {
  constructor(private readonly gcpStorageService: GcpStorageService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: IdCitizenDTO & { metadata: string },
  ) {
    const parsedId = parseInt(body.idCitizen, 10);
    const metadataArray = JSON.parse(body.metadata) as UploadFileDTO[];
    const urls: string[] = [];

    for (const file of files) {
      const metadata = metadataArray.find(
        (m) => m.fileName === file.originalname,
      );

      if (!metadata) {
        throw new Error(`No metadata found for file ${file.originalname}`);
      }

      const url = await this.gcpStorageService.uploadFileWithMetadata(
        file,
        parsedId,
        metadata,
      );
      urls.push(url);
    }

    return {
      message: 'Files uploaded successfully',
      urls,
    };
  }

  @Get('download-file/:idCitizen/:fileName')
  async downloadFile(
    @Param('idCitizen') idCitizen: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    const parsedId = parseInt(idCitizen, 10);
    return this.gcpStorageService.streamFileToResponse(parsedId, fileName, res);
  }
  @Post('create-folder')
  async createFolder(@Body() body: IdCitizenDTO) {
    const parsedId = parseInt(body.idCitizen, 10);
    const folderUrl =
      await this.gcpStorageService.createCitizenFolder(parsedId);

    return {
      message: 'folder created successfully',
      folderUrl,
    };
  }
  @Get('list-documents/:idCitizen')
  async listCitizenDocuments(@Param() params: IdCitizenDTO) {
    const parsedId = parseInt(params.idCitizen, 10);
    const files = await this.gcpStorageService.listDocuments(parsedId);
    return {
      message: 'Documents listed successfully',
      files,
    };
  }

  @Post('transfer-files')
  async copyFilesToMyFolder(
    @Body()
    body: {
      sourceCitizenId: number;
      targetCitizenId: number;
      fileNames: string[];
    },
  ) {
    const { sourceCitizenId, targetCitizenId, fileNames } = body;

    if (!Array.isArray(fileNames) || fileNames.length === 0) {
      throw new Error('fileNames must be a non-empty array');
    }

    const urls = await this.gcpStorageService.transferFilesBetweenFolders(
      sourceCitizenId,
      targetCitizenId,
      fileNames,
    );

    return {
      message: `Archivos copiados correctamente de la carpeta del ciudadano ${sourceCitizenId} a la del ciudadano ${targetCitizenId}`,
      copiedFiles: urls,
    };
  }

  @Post('sign-file')
  async signFileByName(
    @Query('idCitizen') idCitizen: string,
    @Query('fileName') fileName: string,
  ) {
    if (!idCitizen || !fileName) {
      throw new Error('idCitizen and fileName are required');
    }

    const parsedId = parseInt(idCitizen, 10);
    await this.gcpStorageService.signFileByName(parsedId, fileName);

    return {
      message: `File ${fileName} for citizen ${idCitizen} signed successfully`,
    };
  }
}
