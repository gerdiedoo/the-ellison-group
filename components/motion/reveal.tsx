'use client';
import { useEffect, useRef } from 'react';
export function MotionSystem() {
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:0.08});
  document.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));
  let stop:(()=>void)|undefined;
  if(window.matchMedia('(pointer:fine)').matches){import('lenis').then(({default:Lenis})=>{const lenis=new Lenis({autoRaf:true,duration:0.8,anchors:true});stop=()=>lenis.destroy();});}
  return()=>{observer.disconnect();stop?.();};
 },[]);return null;
}
export function CountUp({value,prefix='',suffix=''}:{value:number;prefix?:string;suffix?:string}) {const ref=useRef<HTMLSpanElement>(null);useEffect(()=>{const el=ref.current;if(!el||matchMedia('(prefers-reduced-motion:reduce)').matches)return;let frame=0;const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)return;const start=performance.now();const tick=(now:number)=>{const t=Math.min((now-start)/850,1);el.textContent=`${prefix}${Math.round(value*(1-Math.pow(1-t,3))).toLocaleString('en-US')}${suffix}`;if(t<1)frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);observer.disconnect();});observer.observe(el);return()=>{observer.disconnect();cancelAnimationFrame(frame);};},[value,prefix,suffix]);return <span ref={ref}>{prefix}{value.toLocaleString('en-US')}{suffix}</span>;}
