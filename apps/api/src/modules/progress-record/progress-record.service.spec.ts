import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProgressRecordService } from './progress-record.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { BoardAuthService } from '../../common/services/board-auth.service';
import { AchievementSyncService } from '../../common/services/achievement-sync.service';

describe('ProgressRecordService', () => {
  let service: ProgressRecordService;
  let prisma: Record<string, any>;
  let notificationService: Record<string, jest.Mock>;
  let achievementSync: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = {
      checkpoint: {
        findUnique: jest.fn(),
      },
      progressRecord: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      bingoBoard: {
        findUnique: jest.fn(),
      },
    };
    notificationService = {
      createNotification: jest.fn().mockResolvedValue(undefined),
    };
    achievementSync = {
      syncCheckpointAchievedCount: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProgressRecordService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
        { provide: BoardAuthService, useValue: { assertBoardAccess: jest.fn() } },
        { provide: AchievementSyncService, useValue: achievementSync },
      ],
    }).compile();

    service = module.get(ProgressRecordService);
  });

  describe('create', () => {
    it('PENDING 상태로 생성 + 리뷰어에게 알림', async () => {
      prisma.checkpoint.findUnique.mockResolvedValue({
        id: 1, title: 'CP',
        bingoItem: { id: 10, boardId: 1, board: { ownerId: 1 } },
      });
      prisma.progressRecord.create.mockResolvedValue({
        id: 1, status: 'PENDING', checkpointId: 1,
        author: { id: 1, nickname: 'nick', profileImageUrl: null },
      });
      prisma.bingoBoard.findUnique.mockResolvedValue({
        members: [{ userId: 5 }],
      });

      const result = await service.create(1, 1, {
        content: 'done', recordedAt: '2025-06-15',
      });
      expect(result.status).toBe('PENDING');
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        5, 'REVIEW_REQUEST', 'PROGRESS_RECORD', 1, expect.any(String),
      );
    });
  });

  describe('reviewRecord', () => {
    const checkpointData = {
      id: 1, title: 'CP',
      bingoItem: {
        id: 10, boardId: 1,
        board: {
          ownerId: 1,
          members: [{ userId: 5, role: 'REVIEWER' }],
        },
      },
    };

    it('APPROVED 상태 변경 + achievementSync 호출', async () => {
      prisma.checkpoint.findUnique.mockResolvedValue(checkpointData);
      prisma.progressRecord.findUnique.mockResolvedValue({
        id: 1, checkpointId: 1, status: 'PENDING', authorId: 1,
      });
      prisma.progressRecord.update.mockResolvedValue({
        id: 1, status: 'APPROVED',
        author: { id: 1, nickname: 'nick', profileImageUrl: null },
      });

      const result = await service.reviewRecord(1, 1, 5, 'APPROVED');
      expect(result.status).toBe('APPROVED');
      expect(achievementSync.syncCheckpointAchievedCount).toHaveBeenCalledWith(1, 5);
    });

    it('리뷰어가 아니면 → ForbiddenException', async () => {
      prisma.checkpoint.findUnique.mockResolvedValue(checkpointData);
      await expect(service.reviewRecord(1, 1, 99, 'APPROVED')).rejects.toThrow(ForbiddenException);
    });

    it('이미 같은 상태면 → BadRequestException', async () => {
      prisma.checkpoint.findUnique.mockResolvedValue(checkpointData);
      prisma.progressRecord.findUnique.mockResolvedValue({
        id: 1, checkpointId: 1, status: 'APPROVED', authorId: 1,
      });
      await expect(service.reviewRecord(1, 1, 5, 'APPROVED')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('작성자만 수정 가능', async () => {
      // assertCheckpointAccessible
      prisma.checkpoint.findUnique.mockResolvedValue({
        id: 1,
        bingoItem: {
          boardId: 1,
          board: { ownerId: 1, members: [{ userId: 1 }] },
        },
      });
      // assertRecordOwner - not the author
      prisma.progressRecord.findUnique.mockResolvedValue({
        id: 1, checkpointId: 1, authorId: 99,
      });

      await expect(
        service.update(1, 1, 5, { content: 'updated' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('작성자만 삭제 가능', async () => {
      prisma.checkpoint.findUnique.mockResolvedValue({
        id: 1,
        bingoItem: {
          boardId: 1,
          board: { ownerId: 1, members: [{ userId: 1 }] },
        },
      });
      prisma.progressRecord.findUnique.mockResolvedValue({
        id: 1, checkpointId: 1, authorId: 99,
      });

      await expect(service.remove(1, 1, 5)).rejects.toThrow(ForbiddenException);
    });

    it('삭제 성공 + achievementSync 호출', async () => {
      prisma.checkpoint.findUnique.mockResolvedValue({
        id: 1,
        bingoItem: {
          boardId: 1,
          board: { ownerId: 1, members: [{ userId: 1 }] },
        },
      });
      prisma.progressRecord.findUnique.mockResolvedValue({
        id: 1, checkpointId: 1, authorId: 1,
      });
      prisma.progressRecord.delete.mockResolvedValue({ id: 1 });

      await service.remove(1, 1, 1);
      expect(achievementSync.syncCheckpointAchievedCount).toHaveBeenCalledWith(1, 1);
    });
  });
});
