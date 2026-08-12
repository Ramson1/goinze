import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ToastContainer from '@/components/Toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Goinzeschool Admin',
    template: '%s | Goinzeschool Admin',
  },
  description:
    'Goinzeschool Enterprise School ERP — Administration Portal for managing students, admissions, academics, finance and more.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
