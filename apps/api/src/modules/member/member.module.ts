import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { InviteController } from './invite.controller';
import { MemberService } from './member.service';

@Module({
  controllers: [MemberController, InviteController],
  providers: [MemberService],
})
export class MemberModule {}
