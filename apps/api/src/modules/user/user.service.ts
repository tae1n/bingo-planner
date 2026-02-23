import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorMessages } from '../../common/constants/error-messages';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        nationality: true,
        job: true,
        phone: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async updateMe(
    userId: number,
    dto: {
      nickname?: string;
      nationality?: string;
      job?: string;
      phone?: string;
      profileImageUrl?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        nationality: true,
        job: true,
        phone: true,
        profileImageUrl: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException();

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid)
      throw new BadRequestException(ErrorMessages.WRONG_CURRENT_PASSWORD);

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: '비밀번호가 변경되었습니다.' };
  }
}
