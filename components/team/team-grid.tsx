'use client';
import { useState } from 'react';
import { AgentCard } from '@/components/sections/cards';
import { EmptyState } from '@/components/ui/primitives';
import type { Agent } from '@/lib/types';
export function TeamGrid({agents}:{agents:Agent[]}){const[q,setQ]=useState('');const rows=agents.filter(a=>`${a.full_name} ${a.title}`.toLowerCase().includes(q.toLowerCase()));return <><label className="team-search">Find your local connection<input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or role"/></label>{rows.length?<div className="agent-grid">{rows.map(a=><AgentCard key={a.id} agent={a}/>)}</div>:<EmptyState title="Let's find the right person." body="We couldn't match that name. Try another search, or reach out and we'll connect you with the team."/>}</>;}
