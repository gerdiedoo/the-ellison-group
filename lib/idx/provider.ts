import type { Listing } from '@/lib/types';
export interface IdxProvider { readonly name:string; sync(since?:string):Promise<Listing[]>; }
