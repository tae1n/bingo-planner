import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecordStatus, BoardStatus } from '@bingo-planner/shared';

@Injectable()
export class AchievementSyncService {
  constructor(private prisma: PrismaService) {}

  async syncCheckpointAchievedCount(checkpointId: number, userId: number) {
    const approvedCount = await this.prisma.progressRecord.count({
      where: { checkpointId, status: 'APPROVED' as RecordStatus },
    });
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      include: { bingoItem: { select: { id: true } } },
    });
    if (!checkpoint) return;

    const isNowAchieved = approvedCount >= checkpoint.targetCount;
    await this.prisma.checkpoint.update({
      where: { id: checkpointId },
      data: {
        achievedCount: approvedCount,
        isAchieved: isNowAchieved,
        achievedAt: isNowAchieved && !checkpoint.isAchieved ? new Date() : isNowAchieved ? checkpoint.achievedAt : null,
        achievedBy: isNowAchieved && !checkpoint.isAchieved ? userId : isNowAchieved ? checkpoint.achievedBy : null,
      },
    });

    await this.syncItemAchievement(checkpoint.bingoItem.id, userId);
  }

  async syncItemAchievement(itemId: number, userId: number) {
    const item = await this.prisma.bingoItem.findUnique({
      where: { id: itemId },
      include: { checkpoints: { select: { isAchieved: true } } },
    });
    if (!item) return;
    if (item.checkpoints.length === 0) return;

    const allAchieved = item.checkpoints.every((cp) => cp.isAchieved);
    if (allAchieved && !item.isAchieved) {
      await this.prisma.bingoItem.update({
        where: { id: itemId },
        data: { isAchieved: true, achievedAt: new Date(), achievedBy: userId },
      });
      await this.syncBoardAchievement(item.boardId);
    } else if (!allAchieved && item.isAchieved) {
      await this.prisma.bingoItem.update({
        where: { id: itemId },
        data: { isAchieved: false, achievedAt: null, achievedBy: null },
      });
      await this.syncBoardAchievement(item.boardId);
    }
  }

  async syncBoardAchievement(boardId: number) {
    const board = await this.prisma.bingoBoard.findUnique({
      where: { id: boardId },
      select: { size: true, status: true },
    });
    if (!board) return;
    const totalSlots = board.size * board.size;
    const items = await this.prisma.bingoItem.findMany({
      where: { boardId },
      select: { isAchieved: true },
    });
    const allAchieved = items.length === totalSlots && items.every((i) => i.isAchieved);
    const achievedStatus: BoardStatus = 'ACHIEVED';
    const activeStatus: BoardStatus = 'ACTIVE';
    if (allAchieved && board.status !== achievedStatus) {
      await this.prisma.bingoBoard.update({
        where: { id: boardId },
        data: { status: achievedStatus },
      });
    } else if (!allAchieved && board.status === achievedStatus) {
      await this.prisma.bingoBoard.update({
        where: { id: boardId },
        data: { status: activeStatus },
      });
    }
  }
}
