import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
});

export const metadata: Metadata = {
  title: 'เจริญทองเภสัช - ระบบขายยา',
  description: 'ระบบ POS ร้านขายยาเจริญทอง',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sarabun antialiased bg-gray-50`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
