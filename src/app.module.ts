import { Module } from '@nestjs/common';
import { GcpStorageService } from './gcp-storage.service';
import { GcpUploadController } from './gcp-upload.controller';

@Module({
  controllers: [GcpUploadController],
  providers: [GcpStorageService],
})
export class AppModule {}
