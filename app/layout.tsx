import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sonder — Family Personal Development',
  description: 'A personal development programme for children aged 5-16, with a parallel track so you grow alongside them.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
