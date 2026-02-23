import { Module } from '@nestjs/common';
import { CheckpointController } from './checkpoint.controller';
import { CheckpointService } from './checkpoint.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [CheckpointController],
  providers: [CheckpointService],
})
export class CheckpointModule {}
