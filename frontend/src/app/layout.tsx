import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Karibe N.A',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'Crie produtos personalizados com sua arte',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#f5f5f5',
              border: '1px solid #2a2a2a',
            },
            success: {
              iconTheme: { primary: '#e99c08', secondary: '#0f0f0f' },
            },
          }}
        />
      </body>
    </html>
  );
}
