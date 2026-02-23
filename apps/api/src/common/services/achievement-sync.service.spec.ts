import { Test } from '@nestjs/testing';
import { AchievementSyncService } from './achievement-sync.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AchievementSyncService', () => {
  let service: AchievementSyncService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      progressRecord: { count: jest.fn() },
      checkpoint: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      bingoItem: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      bingoBoard: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AchievementSyncService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AchievementSyncService);
  });

  describe('syncCheckpointAchievedCount', () => {
    it('APPROVED 카운트가 targetCount 이상 → isAchieved true', async () => {
      prisma.progressRecord.count.mockResolvedValue(3);
      prisma.checkpoint.findUnique.mockResolvedValue({
        id: 1, targetCount: 3, isAchieved: false, achievedAt: null, achievedBy: null,
        bingoItem: { id: 10 },
      });
      prisma.checkpoint.update.mockResolvedValue({});
      // syncItemAchievement
      prisma.bingoItem.findUnique.mockResolvedValue({
        id: 10, boardId: 1, isAchieved: false,
        checkpoints: [{ isAchieved: true }],
      });
      prisma.bingoItem.update.mockResolvedValue({});
      prisma.bingoBoard.findUnique.mockResolvedValue({ size: 1, status: 'ACTIVE' });
      prisma.bingoItem.findMany.mockResolvedValue([{ isAchieved: true }]);

      await service.syncCheckpointAchievedCount(1, 5);

      const updateCall = prisma.checkpoint.update.mock.calls[0][0];
      expect(updateCall.data.achievedCount).toBe(3);
      expect(updateCall.data.isAchieved).toBe(true);
      expect(updateCall.data.achievedBy).toBe(5);
    });

    it('APPROVED 카운트 미달 → isAchieved false', async () => {
      prisma.progressRecord.count.mockResolvedValue(1);
      prisma.checkpoint.findUnique.mockResolvedValue({
        id: 1, targetCount: 3, isAchieved: true, achievedAt: new Date(), achievedBy: 5,
        bingoItem: { id: 10 },
      });
      prisma.checkpoint.update.mockResolvedValue({});
      // syncItemAchievement
      prisma.bingoItem.findUnique.mockResolvedValue({
        id: 10, boardId: 1, isAchieved: true,
        checkpoints: [{ isAchieved: false }],
      });
      prisma.bingoItem.update.mockResolvedValue({});
      prisma.bingoBoard.findUnique.mockResolvedValue({ size: 1, status: 'ACTIVE' });
      prisma.bingoItem.findMany.mockResolvedValue([{ isAchieved: false }]);

      await service.syncCheckpointAchievedCount(1, 5);

      const updateCall = prisma.checkpoint.update.mock.calls[0][0];
      expect(updateCall.data.isAchieved).toBe(false);
      expect(updateCall.data.achievedAt).toBeNull();
    });
  });

  describe('syncItemAchievement', () => {
    it('모든 CP 달성 → 아이템 달성', async () => {
      prisma.bingoItem.findUnique.mockResolvedValue({
        id: 10, boardId: 1, isAchieved: false,
        checkpoints: [{ isAchieved: true }, { isAchieved: true }],
      });
      prisma.bingoItem.update.mockResolvedValue({});
      prisma.bingoBoard.findUnique.mockResolvedValue({ size: 1, status: 'ACTIVE' });
      prisma.bingoItem.findMany.mockResolvedValue([{ isAchieved: true }]);

      await service.syncItemAchievement(10, 5);
      expect(prisma.bingoItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: expect.objectContaining({ isAchieved: true }),
        }),
      );
    });

    it('일부 미달성 → 미달성 유지 (이미 달성이었으면 해제)', async () => {
      prisma.bingoItem.findUnique.mockResolvedValue({
        id: 10, boardId: 1, isAchieved: true,
        checkpoints: [{ isAchieved: true }, { isAchieved: false }],
      });
      prisma.bingoItem.update.mockResolvedValue({});
      prisma.bingoBoard.findUnique.mockResolvedValue({ size: 1, status: 'ACHIEVED' });
      prisma.bingoItem.findMany.mockResolvedValue([{ isAchieved: false }]);

      await service.syncItemAchievement(10, 5);
      expect(prisma.bingoItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isAchieved: false, achievedAt: null }),
        }),
      );
    });

    it('체크포인트 0개 → 아무것도 안 함', async () => {
      prisma.bingoItem.findUnique.mockResolvedValue({
        id: 10, boardId: 1, isAchieved: false,
        checkpoints: [],
      });

      await service.syncItemAchievement(10, 5);
      expect(prisma.bingoItem.update).not.toHaveBeenCalled();
    });
  });

  describe('syncBoardAchievement', () => {
    it('모든 아이템 달성 → ACHIEVED', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({ size: 1, status: 'ACTIVE' });
      prisma.bingoItem.findMany.mockResolvedValue([{ isAchieved: true }]);
      prisma.bingoBoard.update.mockResolvedValue({});

      await service.syncBoardAchievement(1);
      expect(prisma.bingoBoard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'ACHIEVED' },
        }),
      );
    });

    it('아이템 수 부족 → ACTIVE 유지', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({ size: 3, status: 'ACTIVE' });
      prisma.bingoItem.findMany.mockResolvedValue([{ isAchieved: true }]); // only 1 of 9

      await service.syncBoardAchievement(1);
      expect(prisma.bingoBoard.update).not.toHaveBeenCalled();
    });

    it('ACHIEVED 상태에서 아이템 미달성 → ACTIVE로 복귀', async () => {
      prisma.bingoBoard.findUnique.mockResolvedValue({ size: 1, status: 'ACHIEVED' });
      prisma.bingoItem.findMany.mockResolvedValue([{ isAchieved: false }]);
      prisma.bingoBoard.update.mockResolvedValue({});

      await service.syncBoardAchievement(1);
      expect(prisma.bingoBoard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'ACTIVE' },
        }),
      );
    });
  });
});
