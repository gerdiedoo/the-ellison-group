import { leadSchema } from '@/lib/schemas';
import { guard,body,checkBot,apiError } from '@/lib/security';
import { captureLead } from '@/lib/leads';
export async function POST(request:Request){try{const meta=await guard(request,'leads',12);const data=leadSchema.parse(await body(request));await checkBot(data.turnstile_token);const result=await captureLead(data,meta);return Response.json({success:true,...result},{status:201});}catch(error){return apiError(error);}}
