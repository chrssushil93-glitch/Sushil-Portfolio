import type { ReactNode } from 'react';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const viewport = { width: 'device-width', initialScale: 1 };
export default function Root({ children }: { children: ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
