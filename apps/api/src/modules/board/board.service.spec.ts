import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BoardService } from './board.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardAuthService } from '../../common/services/board-auth.service';

describe('BoardService', () => {
  let service: BoardService;
  let prisma: Record<string, any>;
  let boardAuth: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      bingoBoard: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    boardAuth = {
      assertBoardOwner: jest.fn().mockResolvedValue(undefined),
      assertBoardAccess: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        BoardService,
        { provide: PrismaService, useValue: prisma },
        { provide: BoardAuthService, useValue: boardAuth },
      ],
    }).compile();

    service = module.get(BoardService);
  });

  describe('create', () => {
    it('보드 생성', async () => {
      const dto = { title: 'My Board', size: 3 };
      prisma.bingoBoard.create.mockResolvedValue({ id: 1, ownerId: 1, ...dto });

      const result = await service.create(1, dto);
      expect(prisma.bingoBoard.create).toHaveBeenCalledWith({
        data: {
          ownerId: 1,
          title: 'My Board',
          description: undefined,
          size: 3,
          startDate: null,
          endDate: null,
        },
      });
      expect(result.id).toBe(1);
    });
  });

  describe('findAllByUser', () => {
    it('소유 보드 + 멤버 보드 반환, 역할 매핑', async () => {
      prisma.bingoBoard.findMany.mockResolvedValue([
        {
          id: 1, ownerId: 1,
          _count: { items: 9 },
          items: [{ id: 1 }, { id: 2 }],
          members: [],
        },
        {
          id: 2, ownerId: 99,
          _count: { items: 9 },
          items: [],
          members: [{ role: 'REVIEWER' }],
        },
      ]);

      const result = await service.findAllByUser(1);
      expect(result[0].role).toBe('OWNER');
      expect(result[0].progress).toEqual({ achieved: 2, total: 9 });
      expect(result[1].role).toBe('REVIEWER');
    });
  });

  describe('findOne', () => {
    it('존재하지 않는 보드 → NotFoundException', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('존재하는 보드 반환 (소유자)', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({
        id: 1, ownerId: 1,
        owner: { id: 1, nickname: 'nick', profileImageUrl: null },
        members: [],
        items: [],
      });

      const result = await service.findOne(1, 1);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('소유자 권한 검증 후 업데이트', async () => {
      prisma.bingoBoard.update.mockResolvedValue({ id: 1, title: 'Updated' });

      await service.update(1, 1, { title: 'Updated' });
      expect(boardAuth.assertBoardOwner).toHaveBeenCalledWith(1, 1);
      expect(prisma.bingoBoard.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('소유자 권한 검증 후 삭제', async () => {
      prisma.bingoBoard.delete.mockResolvedValue({ id: 1 });

      await service.remove(1, 1);
      expect(boardAuth.assertBoardOwner).toHaveBeenCalledWith(1, 1);
      expect(prisma.bingoBoard.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
