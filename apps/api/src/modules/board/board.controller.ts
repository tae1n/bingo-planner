import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BoardService } from './board.service';
import type { BoardStatus } from '@bingo-planner/shared';

@ApiTags('Board')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardController {
  constructor(private boardService: BoardService) {}

  @Post()
  @ApiOperation({ summary: '빙고 보드 생성' })
  create(
    @CurrentUser() user: { id: number },
    @Body() dto: { title: string; description?: string; size: number; startDate?: string; endDate?: string },
  ) {
    return this.boardService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '내 보드 목록 조회' })
  findAll(
    @CurrentUser() user: { id: number },
    @Query('status') status?: string,
  ) {
    return this.boardService.findAllByUser(user.id, status);
  }

  @Get(':boardId')
  @ApiOperation({ summary: '보드 상세 조회' })
  findOne(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
  ) {
    return this.boardService.findOne(boardId, user.id);
  }

  @Patch(':boardId')
  @ApiOperation({ summary: '보드 수정' })
  update(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: { title?: string; description?: string; startDate?: string; endDate?: string },
  ) {
    return this.boardService.update(boardId, user.id, dto);
  }

  @Patch(':boardId/status')
  @ApiOperation({ summary: '보드 상태 변경' })
  updateStatus(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: { status: BoardStatus },
  ) {
    return this.boardService.updateStatus(boardId, user.id, dto.status);
  }

  @Delete(':boardId')
  @ApiOperation({ summary: '보드 삭제' })
  remove(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
  ) {
    return this.boardService.remove(boardId, user.id);
  }
}
