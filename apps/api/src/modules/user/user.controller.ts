import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  getMe(@CurrentUser() user: { id: number }) {
    return this.userService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: '내 정보 수정' })
  updateMe(
    @CurrentUser() user: { id: number },
    @Body() dto: { nickname?: string; nationality?: string; job?: string; phone?: string },
  ) {
    return this.userService.updateMe(user.id, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: '비밀번호 변경' })
  changePassword(
    @CurrentUser() user: { id: number },
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.userService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }
}
