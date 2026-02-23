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
import { CheckpointService } from './checkpoint.service';

@ApiTags('Checkpoint')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards/:boardId/items/:itemId/checkpoints')
export class CheckpointController {
  constructor(private checkpointService: CheckpointService) {}

  @Get()
  @ApiOperation({ summary: '체크포인트 목록 조회' })
  findAll(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.checkpointService.findAll(boardId, itemId, user.id);
  }

  @Post()
  @ApiOperation({ summary: '체크포인트 생성' })
  create(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: { title: string; description?: string; deadline?: string; sortOrder?: number },
  ) {
    return this.checkpointService.create(boardId, itemId, user.id, dto);
  }

  @Patch(':checkpointId')
  @ApiOperation({ summary: '체크포인트 수정' })
  update(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('checkpointId', ParseIntPipe) checkpointId: number,
    @Body() dto: { title?: string; description?: string; deadline?: string; sortOrder?: number },
  ) {
    return this.checkpointService.update(boardId, itemId, checkpointId, user.id, dto);
  }

  @Delete(':checkpointId')
  @ApiOperation({ summary: '체크포인트 삭제' })
  remove(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('checkpointId', ParseIntPipe) checkpointId: number,
  ) {
    return this.checkpointService.remove(boardId, itemId, checkpointId, user.id);
  }

  @Patch(':checkpointId/achieve')
  @ApiOperation({ summary: '체크포인트 완료 토글' })
  toggleAchieve(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('checkpointId', ParseIntPipe) checkpointId: number,
  ) {
    return this.checkpointService.toggleAchieve(boardId, itemId, checkpointId, user.id);
  }
}
