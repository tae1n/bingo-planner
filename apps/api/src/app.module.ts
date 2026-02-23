import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BoardModule } from './modules/board/board.module';
import { ItemModule } from './modules/item/item.module';
import { CheckpointModule } from './modules/checkpoint/checkpoint.module';
import { ProgressRecordModule } from './modules/progress-record/progress-record.module';
import { MemberModule } from './modules/member/member.module';
import { CommentModule } from './modules/comment/comment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { TodoModule } from './modules/todo/todo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UserModule,
    BoardModule,
    ItemModule,
    CheckpointModule,
    ProgressRecordModule,
    MemberModule,
    CommentModule,
    NotificationModule,
    CalendarModule,
    TodoModule,
  ],
})
export class AppModule {}
