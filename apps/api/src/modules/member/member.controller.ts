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
import { MemberService } from './member.service';
import type { MemberRole } from '@bingo-planner/shared';

@ApiTags('BoardMember')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards/:boardId/members')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Get()
  @ApiOperation({ summary: '보드 멤버 목록 조회' })
  findAll(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
  ) {
    return this.memberService.findAll(boardId, user.id);
  }

  @Post()
  @ApiOperation({ summary: '보드 멤버 추가' })
  create(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() dto: { email: string; role: MemberRole },
  ) {
    return this.memberService.create(boardId, user.id, dto);
  }

  @Patch(':memberId')
  @ApiOperation({ summary: '멤버 역할 변경' })
  updateRole(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: { role: MemberRole },
  ) {
    return this.memberService.updateRole(boardId, memberId, user.id, dto);
  }

  @Delete(':memberId')
  @ApiOperation({ summary: '멤버 제거' })
  remove(
    @CurrentUser() user: { id: number },
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.memberService.remove(boardId, memberId, user.id);
  }
}
