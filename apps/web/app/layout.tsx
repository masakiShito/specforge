import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '../components/providers';

export const metadata: Metadata = {
  title: 'SpecForge',
  description: 'SpecForge — スキーマ駆動の設計書エディタ',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, overflowX: 'hidden' as const }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
