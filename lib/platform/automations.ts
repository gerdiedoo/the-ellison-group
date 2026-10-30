import 'server-only';
import { all, base, mutateStore } from '@/lib/repository';
import { isMock } from '@/lib/env';
import type { Lead } from '@/lib/types';
import type { AutomationRule } from './types';
import { commit, put, type Operation, applyMock } from './transaction';
export function automationKey(ruleId: string, eventKey: string) {
  return `${ruleId}:${eventKey}`;
}
export async function runAutomations(
  event: AutomationRule['event'],
  lead: Lead,
  eventKey: string,
  now = new Date(),
) {
  const rules = (await all('automation_rules', true)).filter((r) => r.enabled && r.event === event);
  for (const rule of rules) {
    const execute = async (existing: { rule_id: string; event_key: string }[]) => {
      if (existing.some((r) => r.rule_id === rule.id && r.event_key === eventKey)) return [];
      const key = automationKey(rule.id, eventKey),
        ops: Operation[] = [];
      if (rule.action === 'create_task')
        ops.push(
          put('tasks', {
            ...base(),
            title: rule.task_title,
            lead_id: lead.id,
            listing_id: lead.listing_id,
            assigned_to: rule.assigned_to || lead.assigned_to,
            due_at: new Date(now.getTime() + rule.delay_hours * 3600000).toISOString(),
            status: 'open',
            notes: `Created by automation: ${rule.name}`,
            completed_at: null,
            automation_key: key,
          }),
        );
      else
        ops.push(
          put('notifications', {
            ...base(),
            user_id: rule.assigned_to || lead.assigned_to,
            title: rule.task_title,
            body: `${lead.first_name} ${lead.last_name} · ${event.replaceAll('_', ' ')}`,
            lead_id: lead.id,
            read_at: null,
          }),
        );
      ops.push(
        put('automation_runs', {
          ...base(),
          rule_id: rule.id,
          event_key: eventKey,
          status: 'completed',
          result: `${rule.action} created internally; no external message sent.`,
        }),
      );
      return ops;
    };
    if (isMock)
      await mutateStore(async (store) => applyMock(store, await execute(store.automation_runs)));
    else {
      const operations = await execute(await all('automation_runs', true));
      if (operations.length) await commit(operations, `automation:${rule.id}:${eventKey}`);
    }
  }
}
export async function runDueAutomations(now = new Date()) {
  const leads = await all('leads', true);
  let checked = 0;
  for (const lead of leads) {
    if (lead.status === 'closed') continue;
    if (lead.follow_up_at && Date.parse(lead.follow_up_at) <= now.getTime()) {
      await runAutomations('follow_up_due', lead, `follow-up:${lead.id}:${lead.follow_up_at}`, now);
      checked++;
    }
    if (lead.status === 'new' && now.getTime() - Date.parse(lead.created_at) >= 24 * 3600000) {
      await runAutomations(
        'lead_uncontacted',
        lead,
        `uncontacted:${lead.id}:${now.toISOString().slice(0, 10)}`,
        now,
      );
      checked++;
    }
  }
  return { checked };
}
