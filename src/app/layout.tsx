import type { Metadata } from 'next';
import { Chakra_Petch, Russo_One } from 'next/font/google';
import './globals.css';

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const russoOne = Russo_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WynnLootrun Advisor',
  description: 'Real-time lootrun beacon advisor for Wynncraft — phase-aware scoring, combo detection, and expert strategies',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'WynnLootrun Advisor',
    description: 'Real-time lootrun beacon advisor for Wynncraft',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${chakraPetch.variable} ${russoOne.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
