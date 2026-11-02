import 'server-only';
import { writeFile, mkdir, rename } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import seed from '@/supabase/seed/data.json';
import { isMock } from '@/lib/env';
import type { Store, TableName, Tables, Base } from '@/lib/types';
import { serverClient, serviceClient } from '@/lib/supabase/server';
import { normalizeStore } from '@/lib/platform/defaults';
import { isVercelDemoPreview } from '@/lib/preview-demo';
import { mockStorePath } from '@/lib/mock-store-path';
const filename = mockStorePath(process.cwd(), isVercelDemoPreview, process.env.MOCK_DATA_FILE);
let queue: Promise<unknown> = Promise.resolve();
// Mock mode only: synchronous reads keep raw private JSON out of React's development
// I/O promise debugging payload. Production uses the scoped Supabase boundary.
async function readStore(): Promise<Store> {
  try {
    return normalizeStore(JSON.parse(readFileSync(filename, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return normalizeStore(seed);
  }
}
export async function mutateStore<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const result = queue.then(async () => {
    const store = await readStore();
    const value = await fn(store);
    await mkdir(path.dirname(filename), { recursive: true });
    const tmp = `${filename}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(store));
    await rename(tmp, filename);
    return value;
  });
  queue = result.catch(() => {});
  return result;
}
export const base = (): Base => {
  const now = new Date().toISOString();
  return { id: randomUUID(), created_at: now, updated_at: now };
};
export async function all<K extends TableName>(table: K, privileged = false): Promise<Tables[K][]> {
  if (isMock) return (await readStore())[table];
  const client = privileged ? serviceClient() : await serverClient();
  const { data, error } = await client
    .from(table)
    .select(table === 'listings' ? '*,listing_photos(*),listing_features(*)' : '*');
  if (error) throw new Error(`Unable to load ${table}: ${error.message}`);
  if (table === 'listings')
    for (const row of data as unknown as Tables['listings'][])
      row.listing_photos.sort((a, b) => a.sort_order - b.sort_order);
  return data as unknown as Tables[K][];
}
export async function insert<K extends TableName>(table: K, record: Tables[K]): Promise<Tables[K]> {
  if (isMock)
    return mutateStore((store) => {
      (store[table] as Tables[K][]).push(record);
      return record;
    });
  const { data, error } = await serviceClient().from(table).insert(record).select().single();
  if (error) throw new Error(error.message);
  return data as Tables[K];
}
export async function update<K extends TableName>(
  table: K,
  id: string,
  changes: Partial<Tables[K]>,
): Promise<Tables[K] | null> {
  if (isMock)
    return mutateStore((store) => {
      const rows = store[table] as Tables[K][];
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) return null;
      rows[i] = { ...rows[i], ...changes, id, updated_at: new Date().toISOString() };
      return rows[i];
    });
  const { data, error } = await serviceClient()
    .from(table)
    .update(changes as Record<string, unknown>)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Tables[K] | null;
}
export async function remove(table: TableName, id: string) {
  if (isMock)
    return mutateStore((store) => {
      const rows = store[table];
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows.splice(i, 1);
    });
  const { error } = await serviceClient().from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
