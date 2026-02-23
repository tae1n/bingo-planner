import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardAuthService } from '../../common/services/board-auth.service';
import { ErrorMessages } from '../../common/constants/error-messages';
import type { BoardStatus } from '@bingo-planner/shared';

@Injectable()
export class BoardService {
  constructor(
    private prisma: PrismaService,
    private boardAuth: BoardAuthService,
  ) {}

  async create(
    ownerId: number,
    dto: {
      title: string;
      description?: string;
      size: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.prisma.bingoBoard.create({
      data: {
        ownerId,
        title: dto.title,
        description: dto.description,
        size: dto.size,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async findAllByUser(userId: number, status?: string) {
    const boards = await this.prisma.bingoBoard.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId, status: 'ACCEPTED' } } },
        ],
        ...(status ? { status } : {}),
      },
      include: {
        _count: { select: { items: true } },
        items: { where: { isAchieved: true }, select: { id: true } },
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return boards.map((board) => {
      const role: string = board.ownerId === userId
        ? 'OWNER'
        : board.members[0]?.role ?? 'VIEWER';
      return {
        ...board,
        role,
        progress: {
          achieved: board.items.length,
          total: board._count.items,
        },
        items: undefined,
        _count: undefined,
        members: undefined,
      };
    });
  }

  async findOne(boardId: number, userId: number) {
    const board = await this.prisma.bingoBoard.findUnique({
      where: { id: boardId },
      include: {
        owner: {
          select: { id: true, nickname: true, profileImageUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, nickname: true, profileImageUrl: true },
            },
          },
        },
        items: { orderBy: { position: 'asc' } },
      },
    });

    if (!board) throw new NotFoundException(ErrorMessages.BOARD_NOT_FOUND);
    // Inline access check for loaded board (avoids extra DB query)
    const isMember = board.members.some((m) => m.userId === userId);
    if (board.ownerId !== userId && !isMember) {
      await this.boardAuth.assertBoardAccess(boardId, userId);
    }
    return board;
  }

  async update(
    boardId: number,
    userId: number,
    dto: { title?: string; description?: string; startDate?: string; endDate?: string },
  ) {
    await this.boardAuth.assertBoardOwner(boardId, userId);
    return this.prisma.bingoBoard.update({
      where: { id: boardId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async updateStatus(boardId: number, userId: number, status: BoardStatus) {
    await this.boardAuth.assertBoardOwner(boardId, userId);
    return this.prisma.bingoBoard.update({
      where: { id: boardId },
      data: { status },
    });
  }

  async remove(boardId: number, userId: number) {
    await this.boardAuth.assertBoardOwner(boardId, userId);
    return this.prisma.bingoBoard.delete({ where: { id: boardId } });
  }
}
