import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, isRead?: boolean) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(isRead !== undefined ? { isRead } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // targetType/targetId로부터 boardId, itemId, checkpointId를 resolve
    return Promise.all(
      notifications.map(async (n) => {
        const link = await this.resolveLink(n.targetType, n.targetId);
        return { ...n, ...link };
      }),
    );
  }

  private async resolveLink(
    targetType: string,
    targetId: number,
  ): Promise<{ boardId: number | null; itemId: number | null; checkpointId: number | null }> {
    try {
      if (targetType === 'BINGO_ITEM') {
        const item = await this.prisma.bingoItem.findUnique({
          where: { id: targetId },
          select: { id: true, boardId: true },
        });
        return { boardId: item?.boardId ?? null, itemId: item?.id ?? null, checkpointId: null };
      }
      if (targetType === 'CHECKPOINT') {
        const cp = await this.prisma.checkpoint.findUnique({
          where: { id: targetId },
          select: { id: true, bingoItem: { select: { id: true, boardId: true } } },
        });
        return {
          boardId: cp?.bingoItem.boardId ?? null,
          itemId: cp?.bingoItem.id ?? null,
          checkpointId: cp?.id ?? null,
        };
      }
      if (targetType === 'PROGRESS_RECORD') {
        const record = await this.prisma.progressRecord.findUnique({
          where: { id: targetId },
          select: {
            checkpoint: {
              select: {
                id: true,
                bingoItem: { select: { id: true, boardId: true } },
              },
            },
          },
        });
        return {
          boardId: record?.checkpoint.bingoItem.boardId ?? null,
          itemId: record?.checkpoint.bingoItem.id ?? null,
          checkpointId: record?.checkpoint.id ?? null,
        };
      }
    } catch {
      // target entity may have been deleted
    }
    return { boardId: null, itemId: null, checkpointId: null };
  }

  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId)
      throw new NotFoundException(ErrorMessages.NOTIFICATION_NOT_FOUND);
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async createNotification(
    userId: number,
    type: string,
    targetType: string,
    targetId: number,
    message: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, targetType, targetId, message },
    });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: '모든 알림을 읽음 처리했습니다.' };
  }
}
