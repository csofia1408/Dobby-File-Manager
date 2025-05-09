import { Module } from '@nestjs/common';
import { GcpStorageService } from './gcp-storage.service';
import { GcpStorageController } from './gcp-storage.controller';

@Module({
  controllers: [GcpStorageController],
  providers: [GcpStorageService],
  exports: [GcpStorageService],
})
export class GcpStorageModule {}
