export type CommentTargetType = 'BINGO_ITEM' | 'CHECKPOINT' | 'PROGRESS_RECORD';

export interface Comment {
  id: number;
  authorId: number;
  targetType: CommentTargetType;
  targetId: number;
  content: string;
  author: { id: number; nickname: string; profileImageUrl?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreateRequest {
  targetType: CommentTargetType;
  targetId: number;
  content: string;
}

export interface CommentUpdateRequest {
  content: string;
}
