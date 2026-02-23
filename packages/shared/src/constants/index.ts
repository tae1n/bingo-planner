export const BOARD_SIZE = {
  SMALL: 3,
  MEDIUM: 4,
  LARGE: 5,
} as const;

export const CONDITION_TYPES = ['ONCE', 'COUNT', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

export const MEMBER_ROLES = ['VIEWER', 'REVIEWER'] as const;

export const BOARD_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ACHIEVED'] as const;

export const RECORD_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export const MEMBER_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED'] as const;
