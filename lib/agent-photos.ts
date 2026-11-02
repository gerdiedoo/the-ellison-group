import type { Agent } from '@/lib/types';

export const teamPortraits: Record<string, string> = {
  'kerry-ellison': '/team/kerry.avif',
  'james-kirk': '/team/james.avif',
  'angela-stowell': '/team/angela.avif',
  'ericka-bertes': '/team/ericka.webp',
};

export function withTeamPortrait(agent: Agent): Agent {
  const portrait = teamPortraits[agent.slug];
  return portrait && (!agent.photo_path || /^\/seed\/portrait-\d+\.jpg$/.test(agent.photo_path))
    ? { ...agent, photo_path: portrait }
    : agent;
}
