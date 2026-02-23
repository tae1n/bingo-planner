import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardAuthService } from './board-auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BoardAuthService', () => {
  let service: BoardAuthService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      bingoBoard: { findUnique: jest.fn() },
      bingoItem: { findUnique: jest.fn() },
      checkpoint: { findUnique: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        BoardAuthService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(BoardAuthService);
  });

  describe('assertBoardOwner', () => {
    it('소유자 통과', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({ ownerId: 1 });
      await expect(service.assertBoardOwner(1, 1)).resolves.toBeUndefined();
    });

    it('비소유자 → ForbiddenException', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({ ownerId: 1 });
      await expect(service.assertBoardOwner(1, 99)).rejects.toThrow(ForbiddenException);
    });

    it('보드 없음 → NotFoundException', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue(null);
      await expect(service.assertBoardOwner(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertBoardAccess', () => {
    it('소유자 통과', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({
        ownerId: 1, members: [],
      });
      await expect(service.assertBoardAccess(1, 1)).resolves.toBeUndefined();
    });

    it('ACCEPTED 멤버 통과', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({
        ownerId: 1, members: [{ userId: 5 }],
      });
      await expect(service.assertBoardAccess(1, 5)).resolves.toBeUndefined();
    });

    it('비관계자 → ForbiddenException', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({
        ownerId: 1, members: [],
      });
      await expect(service.assertBoardAccess(1, 99)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertReviewerOnly', () => {
    it('REVIEWER 통과', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({
        members: [{ userId: 5, role: 'REVIEWER' }],
      });
      await expect(service.assertReviewerOnly(1, 5)).resolves.toBeUndefined();
    });

    it('VIEWER → ForbiddenException', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({
        members: [{ userId: 5, role: 'VIEWER' }],
      });
      await expect(service.assertReviewerOnly(1, 5)).rejects.toThrow(ForbiddenException);
    });

    it('멤버가 아닌 경우 → ForbiddenException', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({
        members: [],
      });
      await expect(service.assertReviewerOnly(1, 99)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertItemBelongsToBoard', () => {
    it('소속 아이템 반환', async () => {
      prisma.bingoItem.findUnique.mockResolvedValue({ id: 1, boardId: 1 });
      const result = await service.assertItemBelongsToBoard(1, 1);
      expect(result.id).toBe(1);
    });

    it('다른 보드 아이템 → NotFoundException', async () => {
      prisma.bingoItem.findUnique.mockResolvedValue({ id: 1, boardId: 99 });
      await expect(service.assertItemBelongsToBoard(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertCheckpointBelongsToItem', () => {
    it('소속 체크포인트 반환', async () => {
      prisma.checkpoint.findUnique.mockResolvedValue({ id: 1, bingoItemId: 1 });
      const result = await service.assertCheckpointBelongsToItem(1, 1);
      expect(result.id).toBe(1);
    });

    it('다른 아이템 체크포인트 → NotFoundException', async () => {
      prisma.checkpoint.findUnique.mockResolvedValue({ id: 1, bingoItemId: 99 });
      await expect(service.assertCheckpointBelongsToItem(1, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
