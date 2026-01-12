import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './contexts/AuthContext';
import { QueryProvider } from './providers/QueryProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Mini Banking Platform',
  description: 'A clean, performant mini banking platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
