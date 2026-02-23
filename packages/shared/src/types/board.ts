// ── BingoBoard ──

export type BoardStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ACHIEVED';

export interface BingoBoard {
  id: number;
  ownerId: number;
  title: string;
  description?: string;
  size: number;
  startDate?: string;
  endDate?: string;
  status: BoardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BoardCreateRequest {
  title: string;
  description?: string;
  size: number;
  startDate?: string;
  endDate?: string;
}

export interface BoardUpdateRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface BoardListItem extends BingoBoard {
  progress: { achieved: number; total: number };
}

// ── BoardMember ──

export type MemberRole = 'VIEWER' | 'REVIEWER';

export interface BoardMember {
  id: number;
  boardId: number;
  userId: number;
  role: MemberRole;
  user: { id: number; nickname: string; profileImageUrl?: string };
  createdAt: string;
}

export interface MemberInviteRequest {
  email: string;
  role: MemberRole;
}

// ── BingoItem ──

export type ConditionType = 'ONCE' | 'COUNT' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type RecordStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MemberStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface BingoItem {
  id: number;
  boardId: number;
  title: string;
  description?: string;
  position: number;
  color?: string;
  deadline?: string;
  conditionType: ConditionType;
  targetCount: number;
  isAchieved: boolean;
  achievedAt?: string;
  achievedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemCreateRequest {
  title: string;
  description?: string;
  position: number;
  color?: string;
  deadline?: string;
  conditionType: ConditionType;
  targetCount: number;
}

export interface ItemUpdateRequest {
  title?: string;
  description?: string;
  color?: string;
  deadline?: string;
  conditionType?: ConditionType;
  targetCount?: number;
}

export interface ItemPositionUpdateRequest {
  items: { id: number; position: number }[];
}

// ── Checkpoint ──

export interface Checkpoint {
  id: number;
  bingoItemId: number;
  title: string;
  description?: string;
  deadline?: string;
  sortOrder: number;
  isAchieved: boolean;
  achievedAt?: string;
  achievedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CheckpointCreateRequest {
  title: string;
  description?: string;
  deadline?: string;
  sortOrder?: number;
}

export interface CheckpointUpdateRequest {
  title?: string;
  description?: string;
  deadline?: string;
  sortOrder?: number;
}

// ── ProgressRecord ──

export interface ProgressRecord {
  id: number;
  checkpointId: number;
  authorId: number;
  content?: string;
  imageUrls: string[];
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressRecordCreateRequest {
  content?: string;
  imageUrls?: string[];
  recordedAt: string;
}

export interface ProgressRecordUpdateRequest {
  content?: string;
  imageUrls?: string[];
  recordedAt?: string;
}
