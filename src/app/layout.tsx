import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spectra - Color Guessing Party Game',
  description: 'A fun party game where players guess colors based on creative clues. Play with 2-24 friends!',
  keywords: ['party game', 'color game', 'multiplayer', 'guessing game'],
  authors: [{ name: 'Spectra Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f0f1a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  );
}
