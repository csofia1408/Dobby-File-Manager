import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_CONFIG } from 'src/config/rabbitmq.constants';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    RabbitMQModule.forRoot({
      exchanges: [],
      uri: `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}/${process.env.RABBITMQ_VHOST}`,
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitMQSharedModule {}
