import { Module } from '@nestjs/common';
import { GcpStorageService } from './gcp-storage.service';
import { GcpStorageController } from './gcp-storage.controller';

@Module({
  controllers: [GcpStorageController],
  providers: [GcpStorageService],
})
export class GcpStorageModule {}
