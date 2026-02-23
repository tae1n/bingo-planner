import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@ApiTags('Notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  findAll(
    @CurrentUser() user: { id: number },
    @Query('isRead') isRead?: string,
  ) {
    const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.notificationService.findAll(user.id, isReadBool);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '전체 알림 읽음 처리' })
  markAllAsRead(@CurrentUser() user: { id: number }) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  markAsRead(
    @CurrentUser() user: { id: number },
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    return this.notificationService.markAsRead(notificationId, user.id);
  }
}
