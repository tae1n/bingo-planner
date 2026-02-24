import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import BottomTabBar from '@/components/BottomTabBar';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Bingo Planner',
  description: '목표를 빙고 보드로 관리하는 플래너',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }
        `}</Script>
      </body>
    </html>
  );
}
