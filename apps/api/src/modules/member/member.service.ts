import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardAuthService } from '../../common/services/board-auth.service';
import { ErrorMessages } from '../../common/constants/error-messages';
import type { MemberRole } from '@bingo-planner/shared';

@Injectable()
export class MemberService {
  constructor(
    private prisma: PrismaService,
    private boardAuth: BoardAuthService,
  ) {}

  async findAll(boardId: number, userId: number) {
    await this.boardAuth.assertBoardAccess(boardId, userId);
    return this.prisma.boardMember.findMany({
      where: { boardId },
      include: {
        user: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(boardId: number, userId: number, dto: { email: string; role: MemberRole }) {
    await this.boardAuth.assertBoardOwner(boardId, userId);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND_BY_EMAIL);

    const existing = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: user.id } },
    });
    if (existing) throw new ConflictException(ErrorMessages.MEMBER_ALREADY_EXISTS);

    const member = await this.prisma.boardMember.create({
      data: {
        boardId,
        userId: user.id,
        role: dto.role,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
    });

    const board = await this.prisma.bingoBoard.findUnique({
      where: { id: boardId },
      select: { title: true },
    });
    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: 'INVITE',
        targetType: 'BOARD_MEMBER',
        targetId: member.id,
        message: `'${board?.title ?? '보드'}' 보드에 초대되었습니다.`,
      },
    });

    return member;
  }

  async respondToInvite(memberId: number, userId: number, accept: boolean) {
    const member = await this.prisma.boardMember.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new NotFoundException(ErrorMessages.MEMBER_NOT_FOUND);
    if (member.userId !== userId)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_OWN_INVITE_ONLY);
    if (member.status !== 'PENDING')
      throw new BadRequestException(ErrorMessages.PENDING_INVITE_ONLY);

    if (accept) {
      return this.prisma.boardMember.update({
        where: { id: memberId },
        data: { status: 'ACCEPTED' },
        include: {
          user: { select: { id: true, nickname: true, profileImageUrl: true } },
        },
      });
    } else {
      await this.prisma.boardMember.delete({ where: { id: memberId } });
      return { deleted: true };
    }
  }

  async updateRole(boardId: number, memberId: number, userId: number, dto: { role: MemberRole }) {
    await this.boardAuth.assertBoardOwner(boardId, userId);
    const member = await this.assertMemberBelongsToBoard(memberId, boardId);
    return this.prisma.boardMember.update({
      where: { id: member.id },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
    });
  }

  async remove(boardId: number, memberId: number, userId: number) {
    await this.boardAuth.assertBoardOwner(boardId, userId);
    await this.assertMemberBelongsToBoard(memberId, boardId);
    return this.prisma.boardMember.delete({ where: { id: memberId } });
  }

  private async assertMemberBelongsToBoard(memberId: number, boardId: number) {
    const member = await this.prisma.boardMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.boardId !== boardId)
      throw new NotFoundException(ErrorMessages.MEMBER_NOT_FOUND);
    return member;
  }
}
