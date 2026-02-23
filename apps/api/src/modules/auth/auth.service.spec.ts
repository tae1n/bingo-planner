import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock } };
  let jwt: { sign: jest.Mock; verify: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = {
      sign: jest.fn().mockReturnValue('test-token'),
      verify: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('7d') } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('signup', () => {
    const dto = { email: 'a@b.com', password: 'pass', name: 'Test', nickname: 'nick' };

    it('성공: 비밀번호 해싱 확인', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pass');
      prisma.user.create.mockResolvedValue({ id: 1, email: dto.email, nickname: dto.nickname });

      const result = await service.signup(dto);
      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { ...dto, password: 'hashed-pass' },
      });
      expect(result).toEqual({ id: 1, email: 'a@b.com', nickname: 'nick' });
    });

    it('이메일/닉네임 중복 → ConflictException', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 99 });
      await expect(service.signup(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('성공: accessToken/refreshToken 반환', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1, email: 'a@b.com', password: 'hashed', nickname: 'nick', profileImageUrl: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('a@b.com', 'pass');
      expect(result.accessToken).toBe('test-token');
      expect(result.refreshToken).toBe('test-token');
      expect(result.user).toEqual({ id: 1, nickname: 'nick', profileImageUrl: null });
    });

    it('잘못된 이메일 → UnauthorizedException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('bad@email.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('잘못된 비밀번호 → UnauthorizedException', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@b.com', password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login('a@b.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('유효 토큰 → 새 accessToken', async () => {
      jwt.verify.mockReturnValue({ sub: 1, email: 'a@b.com' });
      const result = await service.refresh('valid-refresh');
      expect(result.accessToken).toBe('test-token');
    });

    it('만료/잘못된 토큰 → UnauthorizedException', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('expired'); });
      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
