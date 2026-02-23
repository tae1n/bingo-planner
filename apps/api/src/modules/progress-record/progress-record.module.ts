import { Module } from '@nestjs/common';
import { ProgressRecordController } from './progress-record.controller';
import { UploadController } from './upload.controller';
import { ProgressRecordService } from './progress-record.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [ProgressRecordController, UploadController],
  providers: [ProgressRecordService],
})
export class ProgressRecordModule {}
