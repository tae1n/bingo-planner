'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutGrid, Calendar, CheckCircle, Bell, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

const tabs = [
  { key: 'boards', label: '보드', href: '/boards', Icon: LayoutGrid },
  { key: 'calendar', label: '달력', href: '/calendar', Icon: Calendar },
  { key: 'todos', label: '할 일', href: '/todos', Icon: CheckCircle },
  { key: 'notifications', label: '알림', href: '/notifications', Icon: Bell },
  { key: 'profile', label: '프로필', href: '/profile', Icon: User },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    api<{ id: number }[]>('/notifications?isRead=false')
      .then((data) => setUnreadCount(data.length))
      .catch(() => {});
  }, [accessToken, pathname]);

  if (!accessToken) return null;
  if (pathname === '/login' || pathname === '/signup' || pathname === '/') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface1 border-t border-border z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.href)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition ${
                isActive ? 'text-primary' : 'text-muted hover:text-text'
              }`}
            >
              <tab.Icon className="w-6 h-6" strokeWidth={isActive ? 2 : 1.5} />
              {tab.key === 'notifications' && unreadCount > 0 && (
                <span className="absolute top-1.5 right-1/2 translate-x-3 min-w-[18px] h-[18px] flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <span className={`text-[10px] ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
