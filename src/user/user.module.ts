import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { GcpStorageModule } from 'src/gcp-storage/gcp-storage.module';
import { RabbitMQSharedModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [GcpStorageModule, RabbitMQSharedModule],
  providers: [UserService],
})
export class UserModule {}
