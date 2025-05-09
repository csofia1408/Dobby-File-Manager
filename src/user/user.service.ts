import { Injectable, Logger } from '@nestjs/common';
import { GcpStorageService } from 'src/gcp-storage/gcp-storage.service';
import { UserEventTypeEnum } from './enum/event-types.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRequestEventDto } from './dto/user-request-event.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly gcpStorageService: GcpStorageService) {}

  async handleUserEvents(
    userId: UserRequestEventDto['headers']['userId'],
    operation: UserRequestEventDto['headers']['eventType'],
    message: UserRequestEventDto['payload'],
  ): Promise<void> {
    try {
      switch (operation) {
        case UserEventTypeEnum.CREATE:
          await this.processUserCreation(
            message as CreateUserDto['documentNumber'],
          );
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      this.logger.error(
        `Message processing in handleUserRequest failed: ${error.message}`,
        error.stack,
      );
    }
  }

  async processUserCreation(
    documentNumber: CreateUserDto['documentNumber'],
  ): Promise<void> {
    try {
      await this.gcpStorageService.createCitizenFolder(documentNumber);
    } catch (error) {
      this.logger.error(`User activation failed`, error.stack);
    }
  }
}
