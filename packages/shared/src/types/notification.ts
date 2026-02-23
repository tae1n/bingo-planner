export type NotificationType = 'INVITE' | 'ACHIEVEMENT' | 'COMMENT' | 'DEADLINE' | 'REVIEW_REQUEST' | 'REVIEW';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  targetType: string;
  targetId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}
