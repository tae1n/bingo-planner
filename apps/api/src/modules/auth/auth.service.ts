import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: {
    email: string;
    password: string;
    name: string;
    nickname: string;
  }) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { nickname: dto.nickname }] },
    });
    if (existing) {
      throw new ConflictException(ErrorMessages.EMAIL_OR_NICKNAME_TAKEN);
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashed },
    });

    return { id: user.id, email: user.email, nickname: user.nickname };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }

    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload),
      refreshToken: this.jwt.sign(payload, {
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
      user: {
        id: user.id,
        nickname: user.nickname,
        profileImageUrl: user.profileImageUrl,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken);
      const newPayload = { sub: payload.sub, email: payload.email };
      return {
        accessToken: this.jwt.sign(newPayload),
      };
    } catch {
      throw new UnauthorizedException(ErrorMessages.INVALID_REFRESH_TOKEN);
    }
  }
}
