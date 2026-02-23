import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async findAll(targetType: string, targetId: number) {
    return this.prisma.comment.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
    });
  }

  async create(userId: number, dto: { targetType: string; targetId: number; content: string }) {
    // A4: 진행기록에만 댓글 가능
    if (dto.targetType !== 'PROGRESS_RECORD')
      throw new BadRequestException(ErrorMessages.COMMENT_ON_RECORD_ONLY);

    // A5: 보드 멤버 검증
    const progressRecord = await this.prisma.progressRecord.findUnique({
      where: { id: dto.targetId },
      select: {
        authorId: true,
        checkpoint: {
          select: {
            bingoItem: {
              select: {
                board: {
                  select: {
                    id: true,
                    ownerId: true,
                    members: { where: { status: 'ACCEPTED' }, select: { userId: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!progressRecord)
      throw new NotFoundException(ErrorMessages.PROGRESS_RECORD_NOT_FOUND);

    const board = progressRecord.checkpoint.bingoItem.board;
    const isMember =
      board.ownerId === userId ||
      board.members.some((m) => m.userId === userId);
    if (!isMember)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_BOARD_MEMBER_ONLY_COMMENT);

    const comment = await this.prisma.comment.create({
      data: {
        authorId: userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        content: dto.content,
      },
      include: {
        author: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
    });

    // Comment notification to progress record author (exclude self)
    if (progressRecord.authorId !== userId) {
      const commenter = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { nickname: true },
      });
      await this.notificationService.createNotification(
        progressRecord.authorId,
        'COMMENT',
        'PROGRESS_RECORD',
        dto.targetId,
        `'${commenter?.nickname ?? '사용자'}'님이 댓글을 남겼습니다.`,
      );
    }

    return comment;
  }

  async update(commentId: number, userId: number, dto: { content: string }) {
    const comment = await this.assertCommentAuthor(commentId, userId);
    return this.prisma.comment.update({
      where: { id: comment.id },
      data: { content: dto.content },
      include: {
        author: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
    });
  }

  async remove(commentId: number, userId: number) {
    await this.assertCommentAuthor(commentId, userId);
    return this.prisma.comment.delete({ where: { id: commentId } });
  }

  private async assertCommentAuthor(commentId: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException(ErrorMessages.COMMENT_NOT_FOUND);
    if (comment.authorId !== userId)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_AUTHOR_ONLY);
    return comment;
  }
}
