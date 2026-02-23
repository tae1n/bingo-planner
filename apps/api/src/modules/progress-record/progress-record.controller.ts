import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProgressRecordService } from './progress-record.service';

@ApiTags('ProgressRecord')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkpoints/:checkpointId/progress-records')
export class ProgressRecordController {
  constructor(private progressRecordService: ProgressRecordService) {}

  @Get()
  @ApiOperation({ summary: '진행 기록 목록 조회' })
  findAll(
    @CurrentUser() user: { id: number },
    @Param('checkpointId', ParseIntPipe) checkpointId: number,
  ) {
    return this.progressRecordService.findAll(checkpointId, user.id);
  }

  @Post()
  @ApiOperation({ summary: '진행 기록 생성' })
  create(
    @CurrentUser() user: { id: number },
    @Param('checkpointId', ParseIntPipe) checkpointId: number,
    @Body() dto: { content?: string; imageUrls?: string[]; recordedAt: string },
  ) {
    return this.progressRecordService.create(checkpointId, user.id, dto);
  }

  @Patch(':recordId')
  @ApiOperation({ summary: '진행 기록 수정' })
  update(
    @CurrentUser() user: { id: number },
    @Param('checkpointId', ParseIntPipe) checkpointId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: { content?: string; imageUrls?: string[]; recordedAt?: string },
  ) {
    return this.progressRecordService.update(checkpointId, recordId, user.id, dto);
  }

  @Delete(':recordId')
  @ApiOperation({ summary: '진행 기록 삭제' })
  remove(
    @CurrentUser() user: { id: number },
    @Param('checkpointId', ParseIntPipe) checkpointId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.progressRecordService.remove(checkpointId, recordId, user.id);
  }

  @Patch(':recordId/review')
  @ApiOperation({ summary: '진행 기록 리뷰 (승인/거절)' })
  review(
    @CurrentUser() user: { id: number },
    @Param('checkpointId', ParseIntPipe) checkpointId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: { action: 'APPROVED' | 'REJECTED' },
  ) {
    return this.progressRecordService.reviewRecord(checkpointId, recordId, user.id, dto.action);
  }
}
