'use client';
import { useEffect } from 'react';
export function FavoritesSync() {
  useEffect(() => {
    const sync = async () => {
      try {
        const session = await fetch('/api/auth', { cache: 'no-store' });
        if (!session.ok || !(await session.json()).authenticated) return;
        const response = await fetch('/api/portal/homes', { cache: 'no-store' });
        if (!response.ok) return;
        const rows = (await response.json()) as { listing_id: string }[];
        const local = JSON.parse(localStorage.getItem('ellison-homes') || '[]') as string[];
        const combined = [...new Set([...local, ...rows.map((row) => row.listing_id)])];
        localStorage.setItem('ellison-homes', JSON.stringify(combined));
        window.dispatchEvent(new Event('savedhomes'));
      } catch {
        // Device saves remain available offline.
      }
    };
    void sync();
    window.addEventListener('ellison-auth', sync);
    return () => window.removeEventListener('ellison-auth', sync);
  }, []);
  return null;
}
