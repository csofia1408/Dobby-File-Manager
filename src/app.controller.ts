import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/uploadfiles')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  uploadFile() {
    return this.appService.uploadFileGcp();
  }
}
