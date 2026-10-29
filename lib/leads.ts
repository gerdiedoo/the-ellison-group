import 'server-only';
import { base,mutateStore } from '@/lib/repository';
import { serviceClient } from '@/lib/supabase/server';
import { isMock } from '@/lib/env';
import type { LeadData } from '@/lib/schemas';
import type { Consent,Lead,Showing,Valuation,Outbox } from '@/lib/types';
import { CONSENT_VERSION,consentRecords } from '@/lib/consent';
import { getListings } from '@/lib/data';
import { estimateValue } from '@/lib/valuation';
import { showingIcs } from '@/lib/calendar';
import { ApiError } from '@/lib/security';
import { deliver } from '@/lib/email';
export async function captureLead(data:LeadData,meta:{ip_hash:string;user_agent:string}){
 const lead:Lead={...base(),source:data.source,first_name:data.first_name,middle_name:data.middle_name,last_name:data.last_name,email:data.email,phone:data.phone,interest:data.interest,message:data.message,listing_id:data.listing_id,agent_id:data.agent_id,trigger_source:data.trigger_source,utm:data.utm,...meta,status:'new',assigned_to:null,notes:''};
 const consents:Consent[]=consentRecords(data.email_phone,data.sms,data.newsletter).map(c=>({...base(),lead_id:lead.id,...c,disclosure_version:CONSENT_VERSION,...meta,granted_at:new Date().toISOString()}));
 const listings=await getListings();let showing:Showing|null=null,valuation:Valuation|null=null;
 if(data.listing_id&&!listings.some(l=>l.id===data.listing_id))throw new ApiError(400,'This property is no longer available.');
 if(data.source==='showing'){const date=new Date(data.starts_at),diff=date.getTime()-Date.now();if(!Number.isFinite(diff)||diff<0||diff>15*86400000||date.getUTCMinutes()%30!==0)throw new ApiError(400,'Choose a 30-minute appointment in the next 14 days.');showing={...base(),listing_id:data.listing_id!,lead_id:lead.id,starts_at:date.toISOString(),meeting_type:data.meeting_type,status:'requested'};}
 if(data.source==='valuation'){const found=listings.find(l=>data.address.toLowerCase().includes(l.address_line.toLowerCase()));const result=found?estimateValue({lat:found.lat,lng:found.lng,beds:data.beds,baths:data.baths,sqft:data.sqft,property_type:data.property_type},listings):{low:0,mid:0,high:0,confidence:'low' as const,comps:[],method:'Address requires verified geocoding. We will prepare a manual comparative market analysis.',manual:true};valuation={...base(),lead_id:lead.id,address:data.address,lat:found?.lat??null,lng:found?.lng??null,result,confidence:result.confidence};}
 const listing=listings.find(l=>l.id===data.listing_id);const attachments=showing?[{filename:'showing-request.ics',content:showingIcs({id:showing.id,starts_at:showing.starts_at,address:listing!.address_line,meeting_type:showing.meeting_type})}]:[];
 const outbox:Outbox[]=[{...base(),channel:'email',recipient:process.env.LEADS_NOTIFY_EMAIL||'team@example.invalid',subject:`New ${data.source} inquiry`,body:`${lead.first_name} ${lead.last_name}\n${lead.email}\n${lead.phone}\n${lead.message}\n${data.address}\n${listing?.address_line||''}`,attachments,sent_at:null}];
 if(showing)outbox.push({...base(),channel:'email',recipient:lead.email,subject:'Your showing request is with our team',body:`Thank you for your interest in ${listing!.address_line}. We are reviewing your request and will be in touch shortly!\nYour requested time: ${new Date(showing.starts_at).toLocaleString('en-US',{timeZone:'America/Chicago'})} (Central Time). This appointment is tentative.`,attachments,sent_at:null});
 if(isMock)await mutateStore(store=>{store.leads.push(lead);store.consents.push(...consents);if(showing)store.showing_requests.push(showing);if(valuation)store.valuation_requests.push(valuation);if(data.newsletter&&!store.newsletter_subscribers.some(s=>s.email===lead.email))store.newsletter_subscribers.push({...base(),email:lead.email,status:'active',confirmed_at:null});store.dev_outbox.push(...outbox);});
 else{const{error}=await serviceClient().rpc('submit_lead_bundle',{payload:{lead,consents,showing,valuation,outbox,newsletter:data.newsletter}});if(error)throw new Error(error.message);}
 await Promise.allSettled(outbox.map(deliver));return{lead_id:lead.id,showing,valuation};
}
