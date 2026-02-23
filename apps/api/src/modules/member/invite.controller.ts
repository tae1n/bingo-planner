import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberService } from './member.service';

@ApiTags('Invite')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invites')
export class InviteController {
  constructor(private memberService: MemberService) {}

  @Patch(':memberId/respond')
  @ApiOperation({ summary: '초대 수락/거절' })
  respond(
    @CurrentUser() user: { id: number },
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: { accept: boolean },
  ) {
    return this.memberService.respondToInvite(memberId, user.id, dto.accept);
  }
}
