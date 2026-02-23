'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { CalendarEvent } from '@/types';
import { deduplicateEvents } from '@/utils/calendar';

export default function CalendarPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<CalendarEvent[]>(
        `/calendar/events?year=${year}&month=${month}`,
      );
      setEvents(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    fetchEvents();
  }, [accessToken, fetchEvents]);

  function goMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setYear(newYear);
    setMonth(newMonth);
    setSelectedDate(null);
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const list = eventsByDate.get(ev.date) ?? [];
    list.push(ev);
    eventsByDate.set(ev.date, list);
  }

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  if (!accessToken) return null;

  return (
    <main className="min-h-dvh bg-bg p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-2xl font-bold text-text">달력</h1>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => goMonth(-1)}
            className="px-3 py-1 border border-border rounded-[var(--radius-control)] hover:bg-surface2 transition"
          >
            ◀
          </button>
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setSelectedDate(null); }}
              className="px-2 py-1 border border-border rounded-[var(--radius-control)] bg-surface1"
            >
              {Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => { setMonth(Number(e.target.value)); setSelectedDate(null); }}
              className="px-2 py-1 border border-border rounded-[var(--radius-control)] bg-surface1"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => goMonth(1)}
            className="px-3 py-1 border border-border rounded-[var(--radius-control)] hover:bg-surface2 transition"
          >
            ▶
          </button>
        </div>

        {loading ? (
          <p className="text-muted text-center py-12">로딩 중...</p>
        ) : (
          <div className="bg-surface1 rounded-[var(--radius-card)] shadow overflow-hidden">
            <div className="grid grid-cols-7 text-center text-sm font-medium text-muted border-b border-border">
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={idx} className="h-24 border-b border-r border-border" />;
                }
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const rawEvents = eventsByDate.get(dateStr) ?? [];
                const dayEvents = deduplicateEvents(rawEvents);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`h-24 border-b border-r border-border p-1 text-left transition hover:bg-surface2 ${
                      isSelected ? 'bg-primary/10 ring-2 ring-primary/40' : ''
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isToday
                          ? 'bg-primary text-white rounded-full w-6 h-6 inline-flex items-center justify-center'
                          : idx % 7 === 0
                            ? 'text-danger'
                            : idx % 7 === 6
                              ? 'text-primary'
                              : 'text-text'
                      }`}
                    >
                      {day}
                    </span>
                    <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev, evi) => (
                        <div key={`${ev.type}-${ev.id}-${evi}`} className="flex items-center gap-0.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            ev.type === 'ITEM' ? 'bg-primary' : 'bg-success'
                          }`} />
                          <span className="text-[10px] leading-tight text-muted truncate">
                            {ev.type === 'CHECKPOINT' ? ev.itemTitle : ev.title}
                          </span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-muted pl-2">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-3 text-xs text-muted justify-center">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" /> 아이템
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" /> 체크포인트
          </span>
        </div>

        {selectedDate && (
          <div className="mt-6 bg-surface1 rounded-[var(--radius-card)] shadow p-4">
            <h2 className="text-lg font-semibold text-text mb-3">
              {selectedDate} 이벤트
            </h2>
            {selectedEvents.length === 0 ? (
              <p className="text-muted text-sm">이벤트가 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {deduplicateEvents(selectedEvents).map((ev) => (
                  <li key={`${ev.type}-${ev.id}`}>
                    <button
                      onClick={() =>
                        router.push(`/boards/${ev.boardId}/items/${ev.itemId}`)
                      }
                      className="w-full text-left px-3 py-2 rounded-[var(--radius-control)] hover:bg-surface2 transition flex items-center gap-3"
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          ev.type === 'ITEM' ? 'bg-primary' : 'bg-success'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-text block truncate">
                          {ev.type === 'CHECKPOINT' ? ev.itemTitle : ev.title}
                        </span>
                        {ev.type === 'CHECKPOINT' && (
                          <span className="text-xs text-muted block truncate">
                            {ev.title}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted flex-shrink-0">
                        {ev.type === 'ITEM' ? '아이템' : '체크포인트'}
                      </span>
                      {ev.isAchieved && (
                        <span className="text-xs px-1.5 py-0.5 bg-success/15 text-success rounded-[var(--radius-chip)] flex-shrink-0">
                          달성
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
