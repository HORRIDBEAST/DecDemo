import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// @ts-ignore: side-effect import of CSS without type declarations
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from 'sonner';
import { SupportBot } from '@/components/layout/support-bot';
import { NativeInit } from '@/components/layout/native-init';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DecentralizedClaim - AI-Powered Insurance Claims',
  description: 'Automated insurance claim processing with blockchain verification',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NativeInit />
          {children}
          <SupportBot />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}