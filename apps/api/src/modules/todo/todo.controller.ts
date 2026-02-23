import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TodoService } from './todo.service';

@ApiTags('Todo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodoController {
  constructor(private todoService: TodoService) {}

  @Get()
  @ApiOperation({ summary: '할 일 목록 조회 (기한 급한 순)' })
  getTodos(@CurrentUser() user: { id: number }) {
    return this.todoService.getTodos(user.id);
  }

  @Get('tree')
  @ApiOperation({ summary: '할 일 트리 조회 (보드 > 아이템 > 체크포인트)' })
  getTodoTree(@CurrentUser() user: { id: number }) {
    return this.todoService.getTodoTree(user.id);
  }
}
