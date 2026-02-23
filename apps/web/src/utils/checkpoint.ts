interface HasDates {
  startDate: string | null;
  deadline: string | null;
}

export function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function isCurrent<T extends HasDates>(cp: T, today: string): boolean {
  const start = cp.startDate;
  const end = cp.deadline;
  if (!start && !end) return true;
  if (start && end) return today >= start && today <= end;
  if (end) return today <= end;
  if (start) return today >= start;
  return true;
}

export function isPast<T extends HasDates>(cp: T, today: string): boolean {
  if (!cp.deadline) return false;
  return cp.deadline < today;
}

export function filterCheckpointsByTime<T extends HasDates>(checkpoints: T[], today: string) {
  const past = checkpoints.filter((cp) => isPast(cp, today));
  const current = checkpoints.filter((cp) => isCurrent(cp, today) && !isPast(cp, today));
  const future = checkpoints.filter((cp) => !isCurrent(cp, today) && !isPast(cp, today));
  return { past, current, future };
}
