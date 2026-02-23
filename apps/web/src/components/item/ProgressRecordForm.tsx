import { useState } from 'react';
import Button from '@/components/common/Button';

interface ProgressRecordFormProps {
  onSubmit: (content: string, files: FileList | null) => Promise<void>;
}

export default function ProgressRecordForm({ onSubmit }: ProgressRecordFormProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  async function handleSubmit() {
    if (!content.trim() && (!files || files.length === 0)) return;
    await onSubmit(content, files);
    setContent('');
    setFiles(null);
  }

  return (
    <div className="mb-4 bg-surface1 border border-border rounded-[var(--radius-control)] p-3">
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-surface2 text-muted rounded-[var(--radius-control)] text-xs cursor-pointer hover:bg-surface2/70 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
          사진
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="hidden"
          />
        </label>
        {files && files.length > 0 && (
          <span className="text-[10px] text-muted">{files.length}장 선택</span>
        )}
      </div>
      {files && files.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto">
          {Array.from(files).map((file, idx) => (
            <img
              key={idx}
              src={URL.createObjectURL(file)}
              alt=""
              className="w-16 h-16 object-cover rounded-lg border border-border"
            />
          ))}
        </div>
      )}
      <textarea
        placeholder="내용을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 bg-surface2 border border-border rounded-[var(--radius-control)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-2"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() && (!files || files.length === 0)}
        >
          등록
        </Button>
      </div>
    </div>
  );
}
