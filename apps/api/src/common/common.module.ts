import { Global, Module } from '@nestjs/common';
import { BoardAuthService } from './services/board-auth.service';
import { AchievementSyncService } from './services/achievement-sync.service';

@Global()
@Module({
  providers: [BoardAuthService, AchievementSyncService],
  exports: [BoardAuthService, AchievementSyncService],
})
export class CommonModule {}
