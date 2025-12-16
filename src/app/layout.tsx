import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';


import { SessionProvider } from '@/components/providers/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'NuttyFans',
  description: 'Creator monetization platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
