import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcpStorageModule } from './gcp-storage/gcp-storage.module';
import { UserModule } from './user/user.module';
import { rabbitMQConfig } from './config/rabbitmq.config';
import { RabbitMQSharedModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [rabbitMQConfig] }),
    GcpStorageModule,
    RabbitMQSharedModule,
    UserModule,
  ],
})
export class AppModule {}
