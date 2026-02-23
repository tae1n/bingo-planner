import { useState } from 'react';
import { api } from '@/lib/api';
import type { Checkpoint } from '@/types';

export function useCheckpoints(boardId: string, itemId: string) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [newCpTitle, setNewCpTitle] = useState('');
  const [creatingCp, setCreatingCp] = useState(false);

  const basePath = `/boards/${boardId}/items/${itemId}/checkpoints`;

  async function fetchCheckpoints() {
    const data = await api<Checkpoint[]>(basePath);
    setCheckpoints(data);
    return data;
  }

  async function createCheckpoint() {
    if (!newCpTitle.trim()) return;
    setCreatingCp(true);
    try {
      await api(basePath, {
        method: 'POST',
        body: JSON.stringify({ title: newCpTitle.trim(), sortOrder: checkpoints.length }),
      });
      setNewCpTitle('');
      await fetchCheckpoints();
    } finally {
      setCreatingCp(false);
    }
  }

  async function updateCheckpoint(cpId: number, title: string) {
    if (!title.trim()) return;
    await api(`${basePath}/${cpId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: title.trim() }),
    });
    await fetchCheckpoints();
  }

  async function deleteCheckpoint(cpId: number) {
    await api(`${basePath}/${cpId}`, { method: 'DELETE' });
    await fetchCheckpoints();
  }

  async function toggleCheckpoint(cpId: number) {
    await api(`${basePath}/${cpId}/achieve`, { method: 'PATCH' });
    await fetchCheckpoints();
  }

  return {
    checkpoints,
    setCheckpoints,
    newCpTitle,
    setNewCpTitle,
    creatingCp,
    fetchCheckpoints,
    createCheckpoint,
    updateCheckpoint,
    deleteCheckpoint,
    toggleCheckpoint,
  };
}
