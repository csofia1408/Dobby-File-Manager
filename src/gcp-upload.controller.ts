import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GcpStorageService } from './gcp-storage.service';
import { IdCitizenDTO, UploadFileDTO } from './dtos/documents.dto';

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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const metadata = metadataArray[i];
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
  @Get('download/:idCitizen/:fileName')
  async downloadCitizenFile(
    @Param('idCitizen') idCitizen: string,
    @Param('fileName') fileName: string,
  ) {
    const parsedId = parseInt(idCitizen, 10);
    const signedUrl = await this.gcpStorageService.getSignedUrl(
      parsedId,
      fileName,
    );
    return {
      message: 'Download URL generated successfully',
      url: signedUrl,
    };
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

  @Post('sign-file-by-name')
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
