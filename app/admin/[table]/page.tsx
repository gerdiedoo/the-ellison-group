import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { all } from '@/lib/repository';
import { adminNames,adminReadTables,type AdminTable } from '@/lib/admin';
import type { TableName } from '@/lib/types';
import { AdminEditor } from '@/components/admin/editor';
export default async function Collection({params}:{params:Promise<{table:string}>}){const user=await currentUser();if(!user||!['agent','admin'].includes(user.role))return null;const{table}=await params;if(!adminReadTables.includes(table))notFound();const rows=await all(table as TableName,true);return <><h2>{adminNames[table as AdminTable]||table.replaceAll('_',' ')}</h2><AdminEditor table={table} rows={rows as unknown as Record<string,unknown>[]}/></>;}
