import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// @ts-ignore: side-effect import of CSS without type declarations
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from 'sonner';

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
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}