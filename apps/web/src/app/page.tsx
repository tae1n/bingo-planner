import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-primary mb-4">Bingo!</h1>
      <p className="text-muted text-center">
        목표를 빙고 보드로 관리하세요
      </p>
      <p className="text-muted text-center text-sm mt-2">
        친구랑 같이 목표 빙고 만들기
      </p>
      <p className="text-muted text-center text-sm">
        기록 올리면 서로 승인해주는 협업 루틴
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="px-6 py-3 bg-primary text-white rounded-[var(--radius-control)] font-medium hover:bg-primary/90 transition"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 border border-primary text-primary rounded-[var(--radius-control)] font-medium hover:bg-primary/10 transition"
        >
          회원가입
        </Link>
      </div>
    </main>
  );
}
