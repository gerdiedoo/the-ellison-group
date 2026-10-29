'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { ArrowUpRight, ChevronDown, Menu, X, Phone } from 'lucide-react';
import { site, navigation } from '@/lib/site';
import { ContactButton } from './site-provider';
export function Wordmark({light=false}:{light?:boolean}) {return <span className={`brand-lockup ${light?'light':''}`}><span className="brand-type">THE ELLISON<span>GROUP<span className="brand-rule"/></span></span><span className="kw-mark">kw<span>KELLER WILLIAMS<br/>REALTY LITTLE ROCK</span></span></span>;}
export function Header() {
  const path=usePathname(); const [scrolled,setScrolled]=useState(false),[hidden,setHidden]=useState(false),[menu,setMenu]=useState(false);
  useEffect(()=>{let last=window.scrollY; const update=()=>{const y=window.scrollY;setScrolled(y>70);setHidden(y>350&&y>last&&y-last>3);last=y;}; window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[]);
  useEffect(()=>{setMenu(false);},[path]);
  const light=path==='/'&&!scrolled;
  return <header className={`site-header ${light?'header-light':''} ${scrolled?'scrolled':''} ${hidden?'header-hidden':''}`}><div className="header-inner"><Link href="/" aria-label="The Ellison Group home"><Wordmark light={light}/></Link><nav className="desktop-nav" aria-label="Main navigation"><Dropdown.Root><Dropdown.Trigger className="nav-button">Properties<ChevronDown size={12}/></Dropdown.Trigger><Dropdown.Portal><Dropdown.Content className="dropdown-content" sideOffset={20}><Dropdown.Item asChild><Link href="/properties/sale">Featured Properties<ArrowUpRight size={14}/></Link></Dropdown.Item><Dropdown.Item asChild><Link href="/properties/sold">Past Transactions<ArrowUpRight size={14}/></Link></Dropdown.Item></Dropdown.Content></Dropdown.Portal></Dropdown.Root><Link href="/home-search/listings">Home Search</Link><Link href="/home-valuation">Home Valuation</Link><Link href="/neighborhoods">Neighborhoods</Link><ContactButton className="nav-button"/></nav><a className="header-phone" href={site.phone_href}><Phone size={13}/>{site.phone}</a><Dialog.Root open={menu} onOpenChange={setMenu}><Dialog.Trigger className="icon-button menu-button" aria-label="Open full menu"><Menu size={22}/></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="full-menu"><div className="menu-top"><Wordmark/><Dialog.Close className="icon-button" aria-label="Close menu"><X/></Dialog.Close></div><Dialog.Title className="sr-only">Explore The Ellison Group</Dialog.Title><Dialog.Description className="sr-only">All pages and resources</Dialog.Description><nav className="menu-grid" aria-label="Full menu">{navigation.map(([name,url],i)=><Link key={url} href={url}><span className="menu-index">{String(i+1).padStart(2,'0')}</span>{name}<ArrowUpRight size={22}/></Link>)}</nav><p className="eyebrow">Rooted in Little Rock. Built around you.</p></Dialog.Content></Dialog.Portal></Dialog.Root></div></header>;
}
