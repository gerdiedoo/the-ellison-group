import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...values:ClassValue[]) => twMerge(clsx(values));
export const money = (n:number, compact=false) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0,...(compact?{notation:'compact' as const}:{})}).format(n);
export const number = (n:number) => new Intl.NumberFormat('en-US').format(n);
export const initials = (s:string) => s.split(' ').slice(0,2).map(p=>p[0]).join('');
