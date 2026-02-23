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
import { ItemService } from './item.service';
import type { ConditionType } from '@bingo-planner/shared';

@ApiTags('BingoItem')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards/:boardId/items')
export class ItemController {
  constructor(private itemService: ItemService) {}

  @Patch('swap')
  @ApiOperation({ summary: '빙고 아이템 위치 교환' })
  swapPositions(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: { positionA: number; positionB: number },
  ) {
    return this.itemService.swapPositions(boardId, user.id, dto);
  }

  @Get(':itemId')
  @ApiOperation({ summary: '빙고 아이템 단건 조회' })
  findOne(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.itemService.findOne(boardId, itemId, user.id);
  }

  @Post()
  @ApiOperation({ summary: '빙고 아이템 생성' })
  create(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: { title: string; position: number; description?: string; color?: string; deadline?: string; conditionType?: ConditionType; targetCount?: number },
  ) {
    return this.itemService.create(boardId, user.id, dto);
  }

  @Patch(':itemId')
  @ApiOperation({ summary: '빙고 아이템 수정' })
  update(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: { title?: string; description?: string; color?: string; deadline?: string; position?: number; conditionType?: ConditionType; targetCount?: number },
  ) {
    return this.itemService.update(boardId, itemId, user.id, dto);
  }

  @Delete(':itemId')
  @ApiOperation({ summary: '빙고 아이템 삭제' })
  remove(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.itemService.remove(boardId, itemId, user.id);
  }

  @Patch(':itemId/achieve')
  @ApiOperation({ summary: '빙고 아이템 완료 토글' })
  toggleAchieve(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.itemService.toggleAchieve(boardId, itemId, user.id);
  }
}
