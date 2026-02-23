'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Notification } from '@/types';
import { toast } from 'sonner';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';

export default function NotificationsPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    fetchNotifications();
  }, [accessToken, filter]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const query = filter === 'all' ? '' : `?isRead=${filter === 'read'}`;
      const data = await api<Notification[]>(`/notifications${query}`);
      setNotifications(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: number) {
    try {
      await api(`/notifications/${notificationId}/read`, { method: 'PATCH' });
      await fetchNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  async function handleRespondInvite(memberId: number, accept: boolean, notificationId: number) {
    try {
      await api(`/invites/${memberId}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ accept }),
      });
      await api(`/notifications/${notificationId}/read`, { method: 'PATCH' });
      await fetchNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      await fetchNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  if (!accessToken) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="min-h-dvh bg-bg p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text">알림</h1>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>전체 읽음</Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-[var(--radius-control)] transition ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-surface1 text-muted border border-border hover:bg-surface2'
              }`}
            >
              {f === 'all' ? '전체' : f === 'unread' ? '미읽음' : '읽음'}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {loading ? (
          <p className="text-muted text-center py-12">로딩 중...</p>
        ) : notifications.length === 0 ? (
          <p className="text-muted text-center py-12">알림이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-surface1 rounded-[var(--radius-control)] shadow p-4 cursor-pointer transition hover:shadow-md ${
                  !notification.isRead ? 'border-l-4 border-primary' : ''
                }`}
                onClick={() => {
                  if (!notification.isRead) handleMarkAsRead(notification.id);
                  if (notification.boardId && notification.itemId) {
                    const cpQuery = notification.checkpointId ? `?cp=${notification.checkpointId}` : '';
                    router.push(`/boards/${notification.boardId}/items/${notification.itemId}${cpQuery}`);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={notification.type} className="text-xs px-2 py-0.5" />
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-text">{notification.message}</p>
                    {notification.type === 'INVITE' && !notification.isRead && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRespondInvite(notification.targetId, true, notification.id);
                          }}
                        >
                          수락
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRespondInvite(notification.targetId, false, notification.id);
                          }}
                        >
                          거절
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted mt-1">
                      {new Date(notification.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
