import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { RabbitMQSharedModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQSharedModule],
  providers: [UserService],
})
export class UserModule {}
