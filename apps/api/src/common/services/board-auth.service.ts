import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorMessages } from '../constants/error-messages';

@Injectable()
export class BoardAuthService {
  constructor(private prisma: PrismaService) {}

  async assertBoardOwner(boardId: number, userId: number) {
    const board = await this.prisma.bingoBoard.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    });
    if (!board) throw new NotFoundException(ErrorMessages.BOARD_NOT_FOUND);
    if (board.ownerId !== userId)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_OWNER_ONLY);
  }

  async assertBoardAccess(boardId: number, userId: number) {
    const board = await this.prisma.bingoBoard.findUnique({
      where: { id: boardId },
      select: {
        ownerId: true,
        members: { where: { status: 'ACCEPTED' }, select: { userId: true } },
      },
    });
    if (!board) throw new NotFoundException(ErrorMessages.BOARD_NOT_FOUND);
    const isMember = board.members.some((m) => m.userId === userId);
    if (board.ownerId !== userId && !isMember)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_NO_ACCESS);
  }

  async assertReviewerOnly(boardId: number, userId: number) {
    const board = await this.prisma.bingoBoard.findUnique({
      where: { id: boardId },
      select: {
        members: {
          where: { status: 'ACCEPTED' },
          select: { userId: true, role: true },
        },
      },
    });
    if (!board) throw new NotFoundException(ErrorMessages.BOARD_NOT_FOUND);
    const reviewer = board.members.find(
      (m) => m.userId === userId && m.role === 'REVIEWER',
    );
    if (!reviewer)
      throw new ForbiddenException(ErrorMessages.FORBIDDEN_REVIEWER_ONLY);
  }

  async assertItemBelongsToBoard(itemId: number, boardId: number) {
    const item = await this.prisma.bingoItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.boardId !== boardId)
      throw new NotFoundException(ErrorMessages.ITEM_NOT_FOUND);
    return item;
  }

  async assertCheckpointBelongsToItem(checkpointId: number, itemId: number) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
    });
    if (!checkpoint || checkpoint.bingoItemId !== itemId)
      throw new NotFoundException(ErrorMessages.CHECKPOINT_NOT_FOUND);
    return checkpoint;
  }
}
