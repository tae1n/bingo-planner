'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    nickname: string;
    profileImageUrl: string | null;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.accessToken, data.refreshToken, data.user);
      router.push('/boards');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-primary mb-8">로그인</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <Input
          label="이메일"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="py-3"
        />
        <Input
          label="비밀번호"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="py-3"
        />

        {error && <p className="text-danger text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="py-3">
          {loading ? '로그인 중...' : '로그인'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </main>
  );
}
