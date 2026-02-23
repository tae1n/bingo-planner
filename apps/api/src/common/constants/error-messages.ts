export const ErrorMessages = {
  // Not Found
  BOARD_NOT_FOUND: '보드를 찾을 수 없습니다.',
  ITEM_NOT_FOUND: '아이템을 찾을 수 없습니다.',
  CHECKPOINT_NOT_FOUND: '체크포인트를 찾을 수 없습니다.',
  RECORD_NOT_FOUND: '진행 기록을 찾을 수 없습니다.',
  PROGRESS_RECORD_NOT_FOUND: '진행기록을 찾을 수 없습니다.',
  COMMENT_NOT_FOUND: '댓글을 찾을 수 없습니다.',
  MEMBER_NOT_FOUND: '멤버를 찾을 수 없습니다.',
  USER_NOT_FOUND_BY_EMAIL: '해당 이메일의 사용자를 찾을 수 없습니다.',
  SWAP_ITEMS_NOT_FOUND: '스왑할 아이템을 찾을 수 없습니다.',
  NOTIFICATION_NOT_FOUND: '알림을 찾을 수 없습니다.',

  // Forbidden
  FORBIDDEN_OWNER_ONLY: '보드 소유자만 이 작업을 수행할 수 있습니다.',
  FORBIDDEN_REVIEWER_ONLY: '리뷰어만 이 작업을 수행할 수 있습니다.',
  FORBIDDEN_AUTHOR_ONLY: '작성자만 이 작업을 수행할 수 있습니다.',
  FORBIDDEN_NO_ACCESS: '이 보드에 접근할 권한이 없습니다.',
  FORBIDDEN_OWNER_ONLY_RECORD: '보드 소유자만 진행 기록을 등록할 수 있습니다.',
  FORBIDDEN_REVIEWER_ONLY_REVIEW: '리뷰어만 진행 기록을 승인/거절할 수 있습니다.',
  FORBIDDEN_OWN_INVITE_ONLY: '본인의 초대만 응답할 수 있습니다.',
  FORBIDDEN_BOARD_MEMBER_ONLY_COMMENT: '해당 보드의 멤버만 댓글을 작성할 수 있습니다.',

  // Bad Request
  MAX_ITEMS_REACHED: '보드의 최대 아이템 수에 도달했습니다.',
  REPEAT_REQUIRES_DATES: '반복 조건 아이템은 보드에 시작일과 종료일이 설정되어야 합니다.',
  REPEAT_CONDITION_IMMUTABLE: '반복 조건 아이템의 달성 조건은 변경할 수 없습니다. 삭제 후 재생성해주세요.',
  ACTIVE_BOARD_ONLY: '활성 상태의 보드에서만 이 작업을 수행할 수 있습니다.',
  AUTO_CHECKPOINT_NO_EDIT: '자동 생성된 체크포인트는 수정할 수 없습니다.',
  AUTO_CHECKPOINT_NO_DELETE: '자동 생성된 체크포인트는 삭제할 수 없습니다.',
  AUTO_CHECKPOINT_REVIEW_ONLY: '자동 생성된 체크포인트는 리뷰 프로세스를 통해서만 달성할 수 있습니다.',
  PENDING_INVITE_ONLY: '대기 중인 초대만 응답할 수 있습니다.',
  COMMENT_ON_RECORD_ONLY: '진행기록에만 댓글을 작성할 수 있습니다.',
  WRONG_CURRENT_PASSWORD: '현재 비밀번호가 올바르지 않습니다.',
  NO_FILES_TO_UPLOAD: '업로드할 파일이 없습니다.',
  IMAGE_FILES_ONLY: '이미지 파일만 업로드할 수 있습니다.',

  // Conflict
  MEMBER_ALREADY_EXISTS: '이미 추가된 멤버입니다.',
  POSITION_ALREADY_TAKEN: '해당 위치에 이미 아이템이 존재합니다.',
  EMAIL_OR_NICKNAME_TAKEN: '이메일 또는 닉네임이 이미 사용 중입니다.',

  // Unauthorized
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  INVALID_REFRESH_TOKEN: '유효하지 않은 리프레시 토큰입니다.',
} as const;
