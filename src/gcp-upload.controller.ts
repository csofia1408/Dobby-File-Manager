import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  Param,
  Get,
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
      message: 'Archivos subidos exitosamente',
      urls,
    };
  }
  @Get('list/:idCitizen')
  async listCitizenDocuments(@Param() params: IdCitizenDTO) {
    const parsedId = parseInt(params.idCitizen, 10);
    const files = await this.gcpStorageService.listDocuments(parsedId);
    return {
      message: 'Archivos listados correctamente',
      files,
    };
  }
}
