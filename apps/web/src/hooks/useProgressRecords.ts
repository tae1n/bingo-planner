import { useState } from 'react';
import { toast } from 'sonner';
import { api, apiUpload } from '@/lib/api';
import type { ProgressRecord } from '@/types';

export function useProgressRecords() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);

  async function fetchRecords(cpId: number) {
    try {
      const data = await api<ProgressRecord[]>(`/checkpoints/${cpId}/progress-records`);
      setRecords(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
      setRecords([]);
    }
  }

  async function createRecord(cpId: number, content: string, files: FileList | null) {
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      const result = await apiUpload<{ urls: string[] }>('/uploads/images', formData);
      imageUrls = result.urls;
    }
    await api(`/checkpoints/${cpId}/progress-records`, {
      method: 'POST',
      body: JSON.stringify({
        content: content.trim() || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        recordedAt: new Date().toISOString().split('T')[0],
      }),
    });
    await fetchRecords(cpId);
  }

  async function deleteRecord(cpId: number, recordId: number) {
    await api(`/checkpoints/${cpId}/progress-records/${recordId}`, { method: 'DELETE' });
    await fetchRecords(cpId);
  }

  async function reviewRecord(cpId: number, recordId: number, action: 'APPROVED' | 'REJECTED') {
    await api(`/checkpoints/${cpId}/progress-records/${recordId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
    await fetchRecords(cpId);
  }

  return {
    records,
    fetchRecords,
    createRecord,
    deleteRecord,
    reviewRecord,
  };
}
