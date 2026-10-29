'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ArrowUpRight, Check } from 'lucide-react';
import { site } from '@/lib/site';
import { isDev, isMock } from '@/lib/env';
const Context = createContext<{openContact:(message?:string)=>void;toast:(message:string)=>void}>({openContact:()=>{},toast:()=>{}});
export const useSite = () => useContext(Context);
export function ContactButton({children='Contact Us',className='button',message}:{children?:React.ReactNode;className?:string;message?:string}) { const {openContact}=useSite(); return <button className={className} onClick={()=>openContact(message)}><span>{children}</span><ArrowUpRight size={17} aria-hidden="true"/></button>; }
export function ContactDetails() { return <div className="contact-details"><p className="eyebrow">Contact Details</p><a href={site.phone_href}>{site.phone}</a><a href={`mailto:${site.email}`}>{site.email}</a><p>{site.address}</p><div className="social-links">{Object.entries(site.socials).slice(0,4).map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer">{name}<ArrowUpRight size={12}/></a>)}</div></div>; }
export function SiteProvider({children}:{children:React.ReactNode}) {
  const [open,setOpen]=useState(false),[message,setMessage]=useState(''),[notice,setNotice]=useState(''),[consent,setConsent]=useState<string|null>('loading');
  useEffect(()=>{setConsent(localStorage.getItem('ellison-consent'));},[]);
  useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(id);},[notice]);
  function choose(value:string){localStorage.setItem('ellison-consent',value);setConsent(value);window.dispatchEvent(new Event('consentchange'));}
  return <Context.Provider value={{openContact:(m='')=>{setMessage(m);setOpen(true);},toast:setNotice}}>{children}
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="drawer"><Dialog.Close className="icon-button drawer-close" aria-label="Close contact drawer"><X/></Dialog.Close><p className="eyebrow">Let's start a conversation</p><Dialog.Title>Leave a Message</Dialog.Title><Dialog.Description className="muted">A home is personal. Your real estate experience should be, too.</Dialog.Description><div id="contact-drawer-form" data-message={message}><ContactFormLoader message={message}/></div><ContactDetails/></Dialog.Content></Dialog.Portal></Dialog.Root>
    {notice&&<div role="status" className="toast"><Check size={18}/>{notice}</div>}
    {consent===null&&<aside className="cookie-banner" aria-label="Cookie preferences"><div><strong>A little privacy, by design.</strong><p>Essential cookies keep your saved homes working. With your permission, analytics help us improve your experience.</p></div><button className="text-link" onClick={()=>choose('essential')}>Essential only</button><button className="button" onClick={()=>choose('all')}>Accept all<Check size={15}/></button></aside>}
    <ProgressiveProfileLoader/>{isDev&&<span className="dev-badge">DEV {isMock?'· DEMO':''}</span>}
  </Context.Provider>;
}
import dynamic from 'next/dynamic';
const ContactFormLoader = dynamic(()=>import('@/components/forms/contact-form').then(m=>m.ContactForm),{loading:()=> <p>Loading contact form…</p>});
const ProgressiveProfileLoader=dynamic(()=>import('@/components/forms/progressive-profile').then(m=>m.ProgressiveProfile),{ssr:false});
