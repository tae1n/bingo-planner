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
import { CommentService } from './comment.service';

@ApiTags('Comment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: '댓글 목록 조회' })
  findAll(
    @Query('targetType') targetType: string,
    @Query('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.commentService.findAll(targetType, targetId);
  }

  @Post()
  @ApiOperation({ summary: '댓글 생성' })
  create(
    @CurrentUser() user: { id: number },
    @Body() dto: { targetType: string; targetId: number; content: string },
  ) {
    return this.commentService.create(user.id, dto);
  }

  @Patch(':commentId')
  @ApiOperation({ summary: '댓글 수정' })
  update(
    @CurrentUser() user: { id: number },
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: { content: string },
  ) {
    return this.commentService.update(commentId, user.id, dto);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: '댓글 삭제' })
  remove(
    @CurrentUser() user: { id: number },
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.commentService.remove(commentId, user.id);
  }
}
