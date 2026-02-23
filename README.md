# Bingo Planner

연간 목표를 빙고 보드로 시각화하고, 다른 사람과 공유하며 목표 달성을 추적하는 플래너 앱

## 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand |
| Backend | NestJS 11, Prisma, PostgreSQL, JWT |
| Infra | Docker, Turborepo, pnpm |
| 기타 | Redis, Swagger (API 문서 자동 생성) |

## 프로젝트 구조

```
bingo-planner/
├── apps/
│   ├── api/          # NestJS 백엔드 (PORT 4000)
│   └── web/          # Next.js 프론트엔드 (PORT 3000)
├── packages/
│   └── shared/       # 공유 타입, 상수
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## 사전 요구사항

- **Node.js** 20+
- **pnpm** 10+
- **Docker** & **Docker Compose**

```bash
# pnpm이 없다면 설치
brew install pnpm
```

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 인프라 실행 (PostgreSQL, Redis)

```bash
docker compose up -d
```

| 서비스 | 주소 | 계정 |
|---|---|---|
| PostgreSQL | `localhost:5432` | `bingo` / `bingo` |
| Redis | `localhost:6379` | - |

### 3. 환경변수 설정

```bash
cp apps/api/.env.example apps/api/.env
```

`.env` 파일을 열어 필요한 값을 수정합니다.

```env
DATABASE_URL="postgresql://bingo:bingo@localhost:5432/bingo_planner?schema=public"
JWT_SECRET="your-jwt-secret-change-in-production"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
```

### 4. DB 마이그레이션

```bash
pnpm --filter @bingo-planner/api prisma:migrate
```

### 5. 개발 서버 실행

```bash
# 프론트엔드 + 백엔드 동시 실행
pnpm dev
```

또는 개별 실행:

```bash
# 백엔드만
pnpm --filter @bingo-planner/api dev

# 프론트엔드만
pnpm --filter @bingo-planner/web dev
```

### 6. 접속

| 서비스 | URL |
|---|---|
| 프론트엔드 | http://localhost:3000 |
| 백엔드 API | http://localhost:4000/api/v1 |
| Swagger 문서 | http://localhost:4000/api/docs |

## 주요 명령어

```bash
# 전체 빌드
pnpm build

# 린트
pnpm lint

# 빌드 산출물 정리
pnpm clean

# Prisma Studio (DB GUI)
pnpm --filter @bingo-planner/api prisma:studio

# Prisma 클라이언트 재생성
pnpm --filter @bingo-planner/api prisma:generate

# 특정 패키지만 빌드
pnpm --filter @bingo-planner/shared build
```

## Docker 배포

### 이미지 빌드

프로젝트 루트에서 실행합니다.

```bash
# API 이미지 빌드
docker build -f apps/api/Dockerfile -t bingo-planner-api .

# Web 이미지 빌드
docker build -f apps/web/Dockerfile -t bingo-planner-web .
```

### 컨테이너 실행

```bash
# API 서버
docker run -d \
  --name bingo-api \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://bingo:bingo@host.docker.internal:5432/bingo_planner?schema=public" \
  -e JWT_SECRET="your-production-secret" \
  bingo-planner-api

# Web 서버
docker run -d \
  --name bingo-web \
  -p 3000:3000 \
  bingo-planner-web
```

### 인프라 관리

```bash
# PostgreSQL + Redis 시작
docker compose up -d

# 중지
docker compose down

# 볼륨 포함 완전 삭제
docker compose down -v
```

## DB 스키마

| 테이블 | 설명 |
|---|---|
| `users` | 회원 정보 |
| `bingo_boards` | 빙고 보드 |
| `board_members` | 보드 멤버 (관찰자/검토자) |
| `bingo_items` | 빙고 아이템 (목표) |
| `checkpoints` | 체크포인트 (세부 목표) |
| `progress_records` | 진행 기록 |
| `comments` | 댓글 (범용) |
| `notifications` | 알림 |

## 권한 모델

| 역할 | 보드 수정 | 달성 확인 | 댓글 | 조회 |
|---|---|---|---|---|
| **생성자 (Owner)** | O | - | O | O |
| **검토자 (Reviewer)** | - | O | O | O |
| **관찰자 (Observer)** | - | - | O | O |
