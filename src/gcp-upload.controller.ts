import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  Param,
  Get,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GcpStorageService } from './gcp-storage.service';
import { IdCitizenDTO, UploadFileDTO, FileNameDTO } from './dtos/documents.dto';
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
    const { idCitizen, metadata } = body;
    const metadataArray = JSON.parse(metadata) as UploadFileDTO[];
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
        idCitizen,
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
    @Param() idCitizenDto: IdCitizenDTO,
    @Param() fileNameDto: FileNameDTO,
    @Res() res: Response,
  ) {
    const { idCitizen } = idCitizenDto;
    const { fileName } = fileNameDto;

    return this.gcpStorageService.streamFileToResponse(
      idCitizen,
      fileName,
      res,
    );
  }

  @Post('create-folder')
  async createFolder(@Body() body: IdCitizenDTO) {
    const parsedId = body.idCitizen;
    const folderUrl =
      await this.gcpStorageService.createCitizenFolder(parsedId);

    return {
      message: 'folder created successfully',
      folderUrl,
    };
  }
  @Get('list-documents/:idCitizen')
  async listCitizenDocuments(@Param() params: IdCitizenDTO) {
    const parsedId = params.idCitizen;
    const files = await this.gcpStorageService.listDocuments(parsedId);

    return {
      message: 'Documents listed successfully',
      files,
    };
  }

  @Post('transfer-files')
  async transferFilesToMyFolder(
    @Body()
    body: {
      sourceCitizenId: string;
      targetCitizenId: string;
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
      message: `Files successfully copied from citizen ${sourceCitizenId}'s folder to citizen ${targetCitizenId}'s folder`,
      copiedFiles: urls,
    };
  }

  @Post('sign-file')
  async signFileByName(
    @Body() idCitizenDto: IdCitizenDTO,
    @Body() fileNameDto: FileNameDTO,
  ) {
    const { idCitizen } = idCitizenDto;
    const { fileName } = fileNameDto;

    await this.gcpStorageService.signFileByName(idCitizen, fileName);

    return {
      message: `File ${fileName} for citizen ${idCitizen} signed successfully`,
    };
  }
  @Post('delete-file')
  async deleteFile(
    @Body() idCitizenDto: IdCitizenDTO,
    @Body() fileNameDto: FileNameDTO,
  ) {
    const { idCitizen } = idCitizenDto;
    const { fileName } = fileNameDto;

    await this.gcpStorageService.deleteFile(idCitizen, fileName);

    return {
      message: `File "${fileName}" deleted successfully`,
    };
  }
}
