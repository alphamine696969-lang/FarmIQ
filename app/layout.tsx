import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { SplashScreen } from '@/components/splash/SplashScreen';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FBFDFA',
};

export const metadata: Metadata = {
  title: 'FarmIQ — Grow Smarter. Earn Better. | Global Smart-Farming Platform',
  description:
    'Evidence-informed agricultural intelligence platform combining grounded AI agronomic assistance, verified market commodity prices, deterministic profit calculators, crop suitability advisor, disease scanner, and agro-weather forecasts.',
  icons: {
    icon: '/brand/logo-icon.png',
    shortcut: '/brand/logo-icon.png',
    apple: '/brand/app-icon.jpg',
  },
  keywords: [
    'smart farming',
    'agriculture intelligence',
    'crop market prices',
    'farm profit calculator',
    'plant disease scanner',
    'agro weather forecast',
    'agronomy RAG',
  ],
  authors: [{ name: 'FarmIQ Agricultural Intelligence' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F5FBEF] text-[#1C2922] font-sans min-h-screen antialiased selection:bg-[#4CAF50] selection:text-[#0B4D2E]">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
