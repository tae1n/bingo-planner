'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sun, Moon } from 'lucide-react';
import { api, apiUpload, toImageUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  nickname: string;
  nationality: string | null;
  job: string | null;
  phone: string | null;
  profileImageUrl: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const storeUser = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [nickname, setNickname] = useState('');
  const [nationality, setNationality] = useState('');
  const [job, setJob] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    fetchProfile();
  }, [accessToken]);

  async function fetchProfile() {
    try {
      const data = await api<UserProfile>('/users/me');
      setProfile(data);
      setNickname(data.nickname);
      setNationality(data.nationality ?? '');
      setJob(data.job ?? '');
      setPhone(data.phone ?? '');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    setProfileMsg('');
    try {
      await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          nickname: nickname.trim() || undefined,
          nationality: nationality.trim() || null,
          job: job.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      setProfileMsg('프로필이 저장되었습니다.');
      await fetchProfile();
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPwMsg('');
    if (newPassword !== confirmPassword) {
      setPwMsg('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setChangingPw(true);
    try {
      await api('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwMsg('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMsg(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setChangingPw(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('files', file);
      const { urls } = await apiUpload<{ urls: string[] }>('/uploads/images', formData);
      if (urls.length > 0) {
        await api('/users/me', {
          method: 'PATCH',
          body: JSON.stringify({ profileImageUrl: urls[0] }),
        });
        await fetchProfile();
        if (storeUser && accessToken) {
          const refreshToken = useAuthStore.getState().refreshToken;
          setAuth(accessToken, refreshToken ?? '', {
            ...storeUser,
            profileImageUrl: urls[0],
          });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  if (!accessToken) return null;

  if (loading) {
    return (
      <main className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-muted">로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-bg p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-text mb-6">회원 정보 관리</h1>

        {/* Profile image */}
        <div className="flex justify-center mb-6">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {profile?.profileImageUrl ? (
              <img
                src={toImageUrl(profile.profileImageUrl)}
                alt="프로필"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/30 hover:border-primary/60 transition"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center text-primary text-3xl font-bold border-4 border-primary/30 hover:border-primary/60 transition">
                {profile?.nickname?.[0] ?? '?'}
              </div>
            )}
            <p className="text-xs text-muted text-center mt-1">클릭하여 변경</p>
          </label>
        </div>

        {/* Profile form */}
        <div className="bg-surface1 rounded-[var(--radius-card)] shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-text mb-4">프로필 수정</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm text-muted block mb-1">이메일</label>
              <input
                type="text"
                value={profile?.email ?? ''}
                disabled
                className="w-full px-4 py-2 border border-border rounded-[var(--radius-control)] bg-surface2 text-muted"
              />
            </div>
            <Input label="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <Input label="국적" value={nationality} onChange={(e) => setNationality(e.target.value)} />
            <Input label="직업" value={job} onChange={(e) => setJob(e.target.value)} />
            <Input label="핸드폰" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {profileMsg && (
            <p className="text-sm mt-3 text-primary">{profileMsg}</p>
          )}
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-4 w-full py-2"
          >
            {saving ? '저장 중...' : '프로필 저장'}
          </Button>
        </div>

        {/* Password change form */}
        <div className="bg-surface1 rounded-[var(--radius-card)] shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-text mb-4">비밀번호 변경</h2>
          <div className="flex flex-col gap-3">
            <Input label="현재 비밀번호" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <Input label="새 비밀번호" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Input label="새 비밀번호 확인" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          {pwMsg && (
            <p className="text-sm mt-3 text-primary">{pwMsg}</p>
          )}
          <Button
            onClick={handleChangePassword}
            disabled={changingPw || !currentPassword || !newPassword || !confirmPassword}
            className="mt-4 w-full py-2"
          >
            {changingPw ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </div>

        {/* Dark mode toggle */}
        <div className="bg-surface1 rounded-[var(--radius-card)] shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              <span className="text-text font-medium">다크 모드</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  theme === 'dark' ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
