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
import { IdCitizenDTO } from './dtos/documents.dto';

@Controller()
export class GcpUploadController {
  constructor(private readonly gcpStorageService: GcpStorageService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: IdCitizenDTO,
  ) {
    const parsedId = parseInt(body.idCitizen, 10);
    const urls: string[] = [];

    for (const file of files) {
      const url = await this.gcpStorageService.uploadFile(file, parsedId);
      urls.push(url);
    }

    return {
      message: 'Archivos subidos exitosamente',
      urls: urls,
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
