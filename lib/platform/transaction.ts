import 'server-only';
import { isMock } from '@/lib/env';
import { base, mutateStore } from '@/lib/repository';
import { serviceClient } from '@/lib/supabase/server';
import type { TableName, Tables, Store, Json } from '@/lib/types';
export type Operation =
  | {
      action: 'upsert';
      table: TableName | 'listing_photos' | 'listing_features';
      record: Record<string, unknown>;
    }
  | { action: 'delete'; table: TableName | 'listing_photos' | 'listing_features'; id: string };
export const put = <K extends TableName>(table: K, record: Tables[K]): Operation => ({
  action: 'upsert',
  table,
  record: record as unknown as Record<string, unknown>,
});
export const del = (table: TableName, id: string): Operation => ({ action: 'delete', table, id });
export function applyMock(store: Store, operations: Operation[]) {
  if (
    operations.some(
      (op) =>
        op.action === 'upsert' &&
        op.table === 'conversation_messages' &&
        op.record.request_id &&
        store.conversation_messages.some((m) => m.request_id === op.record.request_id),
    )
  )
    return;
  for (const op of operations) {
    if (op.table === 'listing_photos' || op.table === 'listing_features') continue;
    const rows = store[op.table] as unknown as Record<string, unknown>[];
    const index = rows.findIndex((r) => r.id === (op.action === 'delete' ? op.id : op.record.id));
    if (op.action === 'delete') {
      if (op.table === 'listings')
        for (const activity of store.activities)
          if (activity.listing_id === op.id) activity.listing_id = null;
      if (index >= 0) rows.splice(index, 1);
    } else if (index < 0) rows.push(structuredClone(op.record));
    else rows[index] = structuredClone(op.record);
  }
}
export async function commit(operations: Operation[], lockKey?: string) {
  if (isMock) return mutateStore((store) => applyMock(store, operations));
  const { error } = await serviceClient().rpc('platform_apply', {
    operations: operations.map((op) => {
      if (op.action === 'upsert' && op.table === 'listings') {
        const record = { ...op.record };
        delete record.listing_photos;
        delete record.listing_features;
        return { ...op, record };
      }
      return op;
    }),
    lock_key: lockKey || null,
  });
  if (error) {
    if (error.code === '23P01')
      throw new ApiError(409, 'That staff member already has an appointment during this time.');
    throw new Error(error.message);
  }
}
import { ApiError } from '@/lib/security';
export const audit = (
  actor: string,
  table: string,
  id: string,
  action: string,
  changes: unknown,
): Operation =>
  put('audit_log', {
    ...base(),
    actor_id: actor,
    table_name: table,
    record_id: id,
    action,
    changes: JSON.parse(JSON.stringify(changes)) as Json,
  });
