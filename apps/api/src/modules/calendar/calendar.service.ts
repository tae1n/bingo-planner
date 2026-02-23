import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CalendarEvent {
  date: string;
  type: 'ITEM' | 'CHECKPOINT';
  id: number;
  title: string;
  boardId: number;
  itemId: number;
  itemTitle: string;
  isAchieved: boolean;
}

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getMonthEvents(
    userId: number,
    year: number,
    month: number,
  ): Promise<CalendarEvent[]> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    // 소유한 보드만 조회
    const boards = await this.prisma.bingoBoard.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const boardIds = boards.map((b) => b.id);
    if (boardIds.length === 0) return [];

    // 아이템 이벤트
    const items = await this.prisma.bingoItem.findMany({
      where: {
        boardId: { in: boardIds },
        deadline: { gte: startDate, lt: endDate },
      },
      select: {
        id: true,
        title: true,
        deadline: true,
        boardId: true,
        isAchieved: true,
      },
    });

    // 체크포인트 이벤트: startDate~deadline 기간이 해당 월과 겹치는 체크포인트
    const checkpoints = await this.prisma.checkpoint.findMany({
      where: {
        bingoItem: { boardId: { in: boardIds } },
        OR: [
          // deadline이 해당 월 범위 안에 있거나
          { deadline: { gte: startDate, lt: endDate } },
          // startDate가 있고, startDate~deadline 구간이 해당 월과 겹치는 경우
          {
            startDate: { lt: endDate },
            deadline: { gte: startDate },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        deadline: true,
        isAchieved: true,
        bingoItem: { select: { id: true, boardId: true, title: true } },
      },
    });

    const events: CalendarEvent[] = [];

    for (const item of items) {
      events.push({
        date: item.deadline!.toISOString().slice(0, 10),
        type: 'ITEM',
        id: item.id,
        title: item.title,
        boardId: item.boardId,
        itemId: item.id,
        itemTitle: item.title,
        isAchieved: item.isAchieved,
      });
    }

    for (const cp of checkpoints) {
      const rangeStart = cp.startDate && cp.startDate > startDate ? cp.startDate : startDate;
      const rangeEnd = cp.deadline && cp.deadline < endDate ? cp.deadline : new Date(Date.UTC(year, month, 0)); // 해당 월 말일

      // startDate~deadline 사이 매일 이벤트 생성
      const cursor = new Date(rangeStart);
      while (cursor <= rangeEnd) {
        events.push({
          date: cursor.toISOString().slice(0, 10),
          type: 'CHECKPOINT',
          id: cp.id,
          title: cp.title,
          boardId: cp.bingoItem.boardId,
          itemId: cp.bingoItem.id,
          itemTitle: cp.bingoItem.title,
          isAchieved: cp.isAchieved,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    return events;
  }
}
