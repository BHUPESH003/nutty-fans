import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { VerificationBanner } from '@/components/common/VerificationBanner';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { LowBalanceProvider } from '@/lib/contexts/LowBalanceContext';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

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
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className={`${inter.variable} bg-[#f4f5fc] font-body text-foreground antialiased`}>
        <SessionProvider>
          <LowBalanceProvider>
            <VerificationBanner />
            {children}
          </LowBalanceProvider>
        </SessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
