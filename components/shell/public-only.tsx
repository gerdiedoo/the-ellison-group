'use client';
import { usePathname } from 'next/navigation';
export function PublicOnly({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith('/admin') ? null : children;
}
