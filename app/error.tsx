'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <section className="page-hero container"><p className="eyebrow">A brief pause</p><h1>Let's try that again.</h1><p className="intro-copy mt-8">We couldn't load this page. Your saved information is still safe.</p><div className="inline-actions mt-8"><button className="button" onClick={reset}>Try again</button><Link href="/" className="text-link">Back to home</Link></div></section>;}
