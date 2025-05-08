import { Injectable, Logger } from '@nestjs/common';
import { UserEventTypeEnum } from './enum/event-types.enum';
import { UserRequestEventDto } from './dto/user-request-event.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async handleUserEvents(
    userId: UserRequestEventDto['headers']['userId'],
    operation: UserRequestEventDto['headers']['eventType'],
    message: UserRequestEventDto['payload'],
  ): Promise<void> {
    try {
      switch (operation) {
        case UserEventTypeEnum.CREATE:
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
}
