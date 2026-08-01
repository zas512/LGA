import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async scheduleHearingReminder(
    hearingId: string,
    hearingDate: Date,
    purpose: string | null
  ): Promise<void> {
    this.logger.log(
      `[Stub] Scheduled hearing reminder for hearing ${hearingId} on date ${hearingDate.toISOString()}. Purpose: ${purpose}`
    );
  }
}
