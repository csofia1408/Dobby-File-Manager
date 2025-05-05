// src/gcp-upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GcpStorageService } from './gcp-storage.service';
import { Param, Get } from '@nestjs/common';

@Controller()
export class GcpUploadController {
  constructor(private readonly gcpStorageService: GcpStorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('idCitizen') idCitizen: string,
  ) {
    const url = await this.gcpStorageService.uploadFile(
      file,
      parseInt(idCitizen),
    );
    return {
      message: 'Archivo subido exitosamente',
      url: url,
    };
  }
  @Get('list/:idCitizen')
  async listCitizenDocuments(@Param('idCitizen') idCitizen: string) {
    const files = await this.gcpStorageService.listDocuments(
      parseInt(idCitizen),
    );
    return {
      message: 'Archivos listados correctamente',
      files,
    };
  }
}
