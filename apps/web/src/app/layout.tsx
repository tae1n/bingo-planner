import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomTabBar from '@/components/BottomTabBar';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Bingo Planner',
  description: '목표를 빙고 보드로 관리하는 플래너',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bingo Planner',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2F5BFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-bg text-text min-h-dvh pb-16">
        <Providers>
          {children}
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  );
}
