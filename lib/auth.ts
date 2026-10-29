import 'server-only';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';
import { isMock } from '@/lib/env';
import { hash,ApiError } from '@/lib/security';
import { all } from '@/lib/repository';
import { serverClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';
export const COOKIE='ellison-demo-session';
export function signSession(id:string){const payload=Buffer.from(JSON.stringify({id,exp:Date.now()+7*86400000})).toString('base64url');return `${payload}.${hash(payload)}`;}
export function verifySession(value:string):string|null{try{const[payload,signature]=value.split('.');const expected=hash(payload);if(!signature||signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(payload,'base64url').toString()) as {id:string;exp:number};return data.exp>Date.now()?data.id:null;}catch{return null;}}
export async function currentUser():Promise<Profile|null>{if(isMock){const value=(await cookies()).get(COOKIE)?.value;const id=value?verifySession(value):null;return id?(await all('profiles',true)).find(p=>p.id===id)||null:null;}const client=await serverClient();const{data:{user}}=await client.auth.getUser();if(!user)return null;const{data}=await client.from('profiles').select('*').eq('id',user.id).single();return data as Profile|null;}
export async function requireUser(){const user=await currentUser();if(!user)throw new ApiError(401,'Sign in to My Search Portal to continue.');return user;}
export async function requireStaff(){const user=await requireUser();if(!['admin','agent'].includes(user.role))throw new ApiError(403,'This area is reserved for the team.');return user;}
