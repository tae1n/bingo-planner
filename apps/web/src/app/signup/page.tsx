'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, nickname }),
      });
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-primary mb-8">회원가입</h1>

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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="py-3"
        />
        <Input
          label="이름"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="py-3"
        />
        <Input
          label="닉네임"
          type="text"
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="py-3"
        />

        {error && <p className="text-danger text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="py-3">
          {loading ? '가입 중...' : '회원가입'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary hover:underline">
          로그인
        </Link>
      </p>
    </main>
  );
}
