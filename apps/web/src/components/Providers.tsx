'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useThemeStore } from '@/store/theme';

export default function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
