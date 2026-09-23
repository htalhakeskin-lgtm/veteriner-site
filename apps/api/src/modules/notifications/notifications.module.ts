import { Global, Module } from '@nestjs/common';

import { DatabaseChannel, SimulatedChannel } from './channels/notification-channel';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/** Global: randevu modulu ve cron gorevleri de kullaniyor. */
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, DatabaseChannel, SimulatedChannel],
  exports: [NotificationsService],
})
export class NotificationsModule {}
