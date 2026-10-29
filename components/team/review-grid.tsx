'use client';
import { useState } from 'react';
import type { Testimonial,Agent } from '@/lib/types';
import { initials } from '@/lib/utils';
export function ReviewGrid({items,agents}:{items:Testimonial[];agents:Agent[]}){const[agent,setAgent]=useState('');return <><label className="team-search">Filter by agent<select value={agent} onChange={e=>setAgent(e.target.value)}><option value="">All agents</option>{agents.map(a=><option key={a.id} value={a.id}>{a.full_name}</option>)}</select></label><div className="review-masonry">{items.filter(t=>!agent||t.agent_id===agent).map(t=><article className="review-card" key={t.id}>{t.rating&&<p className="rating" aria-label={`${t.rating} out of 5 stars`}>{'★'.repeat(Math.round(t.rating))}</p>}<blockquote>{t.body}</blockquote><div className="reviewer"><span className="initials-avatar">{initials(t.reviewer_name)}</span><div><strong>{t.reviewer_name}</strong><p>{agents.find(a=>a.id===t.agent_id)?.full_name}</p></div></div></article>)}</div></>;}
