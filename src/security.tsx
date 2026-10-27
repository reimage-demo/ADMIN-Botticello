import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
export function requireSecurePortal(value:string|undefined) {
  if(!value)return null;
  try {
    const url=new URL(value);
    const local=["localhost","127.0.0.1","[::1]"].includes(location.hostname);
    if(url.protocol!=="https:"||url.username||url.password||!url.hostname.endsWith(".convex.cloud")||(location.protocol!=="https:"&&!(local&&location.protocol==="http:")))return null;
    return url.origin;
  }catch{return null;}
}
export function SessionGate({children}:{children:React.ReactNode}) {
  const session=useQuery(anyApi.admin.me) as {expiresAt:number}|null|undefined;
  const {signOut}=useAuthActions();
  const [expired,setExpired]=useState(false);
  useEffect(()=>{
    if(session===undefined)return;
    const expiresAt=session?.expiresAt??0;
    const expire=()=>{if(Date.now()>=expiresAt){setExpired(true);void signOut().catch(()=>{});}};
    const timer=setTimeout(expire,Math.max(0,expiresAt-Date.now()));
    document.addEventListener("visibilitychange",expire);window.addEventListener("focus",expire);expire();
    return()=>{clearTimeout(timer);document.removeEventListener("visibilitychange",expire);window.removeEventListener("focus",expire);};
  },[session?.expiresAt,session===undefined,signOut]);
  if(expired||session===null)return <div className="fallback"><h2>Your session has ended.</h2><p>Sign in again to view customer information.</p><button onClick={()=>void signOut()}>Return to sign in</button></div>;
  if(!session)return <div className="loading">Checking your session…</div>;
  return <>{children}</>;
}
export function SecurePhoto({requestId,slot,index}:{requestId:string;slot:string;index:number}) {
 const token=useAuthToken(),ref=useRef<HTMLDivElement>(null);
 const [visible,setVisible]=useState(false),[url,setUrl]=useState<string|null>(null),[error,setError]=useState(false);
 useEffect(()=>{
  if(!ref.current)return;
  if(!("IntersectionObserver" in window)){setVisible(true);return;}
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:"100px"});
  observer.observe(ref.current);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!visible||!token)return;
  const controller=new AbortController();let objectUrl:string|undefined;
  setUrl(null);setError(false);
  const base=requireSecurePortal(import.meta.env.VITE_CONVEX_URL);
  if(!base){setError(true);return;}
  const endpoint=new URL(base.replace(/\.convex\.cloud$/, ".convex.site")+"/admin-photo");endpoint.searchParams.set("id",requestId);endpoint.searchParams.set("slot",slot);
  void fetch(endpoint,{headers:{Authorization:`Bearer ${token}`},cache:"no-store",signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error("Photo unavailable");const blob=await response.blob();if(controller.signal.aborted)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);}).catch(()=>{if(!controller.signal.aborted)setError(true);});
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[visible,token,requestId,slot]);
 return <div ref={ref} className="secure-photo">{url?<a href={url} target="_blank" rel="noreferrer"><img src={url} loading="lazy" decoding="async" alt={`Customer photo ${index+1}`}/></a>:<p>{error?"Photo unavailable. Sign in again or retry.":"Loading photo…"}</p>}</div>;
}
