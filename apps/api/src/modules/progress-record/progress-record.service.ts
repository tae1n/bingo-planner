import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { BoardAuthService } from '../../common/services/board-auth.service';
import { AchievementSyncService } from '../../common/services/achievement-sync.service';
import { ErrorMessages } from '../../common/constants/error-messages';
import type { RecordStatus } from '@bingo-planner/shared';

@Injectable()
export class ProgressRecordService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private boardAuth: BoardAuthService,
    private achievementSync: AchievementSyncService,
  ) {}

  async findAll(checkpointId: number, userId: number) {
    const checkpoint = await this.assertCheckpointAccessible(checkpointId, userId);
    return this.prisma.progressRecord.findMany({
      where: { checkpointId: checkpoint.id },
      orderBy: { recordedAt: 'desc' },
      include: {
        author: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
    });
  }

  async create(
    checkpointId: number,
    userId: number,
    dto: { content?: string; imageUrls?: string[]; recordedAt: string },
  ) {
    const checkpoint = await this.assertCheckpointOwnerOnly(checkpointId, userId);
    const record = await this.prisma.progressRecord.create({
      data: {
        checkpointId,
        authorId: userId,
        content: dto.content,
        imageUrls: dto.imageUrls ?? [],
        recordedAt: new Date(dto.recordedAt),
        status: 'PENDING' as RecordStatus,
      },
      include: {
        author: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
    });

    const board = await this.prisma.bingoBoard.findUnique({
      where: { id: checkpoint.bingoItem.boardId },
      select: { members: { where: { status: 'ACCEPTED', role: 'REVIEWER' }, select: { userId: true } } },
    });
    if (board) {
      for (const member of board.members) {
        await this.notificationService.createNotification(
          member.userId,
          'REVIEW_REQUEST',
          'PROGRESS_RECORD',
          record.id,
          `'${checkpoint.title}' 진행기록이 등록되었습니다. 승인해주세요.`,
        );
      }
    }

    return record;
  }

  async reviewRecord(
    checkpointId: number,
    recordId: number,
    userId: number,
    action: Extract<RecordStatus, 'APPROVED' | 'REJECTED'>,
  ) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      include: {
        bingoItem: {
          select: {
            id: true,
            boardId: true,
            board: {
              select: {
                ownerId: true,
                members: { where: { status: 'ACCEPTED' }, select: { userId: true, role: true } },
              },
            },
          },
        },
      },
    });
    if (!checkpoint) throw new NotFoundException(ErrorMessages.CHECKPOINT_NOT_FOUND);

    const board = checkpoint.bingoItem.board;
    const isReviewer = board.members.some(
      (m) => m.userId === userId && m.role === 'REVIEWER',
    );
    if (!isReviewer)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_REVIEWER_ONLY_REVIEW);

    const record = await this.prisma.progressRecord.findUnique({
      where: { id: recordId },
    });
    if (!record || record.checkpointId !== checkpointId)
      throw new NotFoundException(ErrorMessages.RECORD_NOT_FOUND);
    if (record.status === action)
      throw new BadRequestException(`이미 ${action === 'APPROVED' ? '승인' : '거절'}된 진행 기록입니다.`);

    const updated = await this.prisma.progressRecord.update({
      where: { id: recordId },
      data: {
        status: action,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        author: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
    });

    await this.achievementSync.syncCheckpointAchievedCount(checkpointId, userId);

    if (record.authorId !== userId) {
      const statusLabel = action === 'APPROVED' ? '승인' : '거절';
      await this.notificationService.createNotification(
        record.authorId,
        'REVIEW',
        'PROGRESS_RECORD',
        recordId,
        `'${checkpoint.title}' 진행기록이 ${statusLabel}되었습니다.`,
      );
    }

    return updated;
  }

  async update(
    checkpointId: number,
    recordId: number,
    userId: number,
    dto: { content?: string; imageUrls?: string[]; recordedAt?: string },
  ) {
    await this.assertCheckpointAccessible(checkpointId, userId);
    const record = await this.assertRecordOwner(recordId, checkpointId, userId);
    return this.prisma.progressRecord.update({
      where: { id: record.id },
      data: {
        content: dto.content,
        imageUrls: dto.imageUrls,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : undefined,
      },
      include: {
        author: { select: { id: true, nickname: true, profileImageUrl: true } },
      },
    });
  }

  async remove(checkpointId: number, recordId: number, userId: number) {
    await this.assertCheckpointAccessible(checkpointId, userId);
    const record = await this.assertRecordOwner(recordId, checkpointId, userId);

    await this.prisma.progressRecord.delete({ where: { id: recordId } });

    await this.achievementSync.syncCheckpointAchievedCount(checkpointId, userId);

    return { success: true };
  }

  private async assertCheckpointOwnerOnly(checkpointId: number, userId: number) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      include: {
        bingoItem: {
          select: {
            id: true,
            boardId: true,
            board: { select: { ownerId: true } },
          },
        },
      },
    });
    if (!checkpoint) throw new NotFoundException(ErrorMessages.CHECKPOINT_NOT_FOUND);
    if (checkpoint.bingoItem.board.ownerId !== userId)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_OWNER_ONLY_RECORD);
    return checkpoint;
  }

  private async assertCheckpointAccessible(checkpointId: number, userId: number) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      include: {
        bingoItem: {
          select: {
            boardId: true,
            board: {
              select: {
                ownerId: true,
                members: { where: { status: 'ACCEPTED' }, select: { userId: true } },
              },
            },
          },
        },
      },
    });
    if (!checkpoint) throw new NotFoundException(ErrorMessages.CHECKPOINT_NOT_FOUND);
    const board = checkpoint.bingoItem.board;
    const isMember = board.members.some((m) => m.userId === userId);
    if (board.ownerId !== userId && !isMember)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_NO_ACCESS);
    return checkpoint;
  }

  private async assertRecordOwner(recordId: number, checkpointId: number, userId: number) {
    const record = await this.prisma.progressRecord.findUnique({
      where: { id: recordId },
    });
    if (!record || record.checkpointId !== checkpointId)
      throw new NotFoundException(ErrorMessages.RECORD_NOT_FOUND);
    if (record.authorId !== userId)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_AUTHOR_ONLY);
    return record;
  }
}
