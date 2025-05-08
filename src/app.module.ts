import { Module } from '@nestjs/common';
import { GcpStorageService } from './gcp-storage.service';
import { GcpUploadController } from './gcp-upload.controller';
import { UserModule } from './user/user.module';

@Module({
  controllers: [GcpUploadController],
  providers: [GcpStorageService],
  imports: [UserModule],
})
export class AppModule {}
