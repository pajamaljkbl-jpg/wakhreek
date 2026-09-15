'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

const ATTR_KEY='wakhreek_attribution_v1'
const SESSION_KEY='wakhreek_session_v1'
const VISIT_KEY='wakhreek_visit_tracked_v1'
const SIGNUP_KEY='wakhreek_signup_tracked_v1'
const LANDING_KEY='wakhreek_landing_v1'

function getSession(){try{let id=sessionStorage.getItem(SESSION_KEY);if(!id){id=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,id)}return id}catch{return null}}
function getLanding(){try{let p=sessionStorage.getItem(LANDING_KEY);if(!p){p=location.pathname+location.search;sessionStorage.setItem(LANDING_KEY,p)}return p}catch{return location.pathname}}
function getAttribution(){
 try{
  const q=new URLSearchParams(location.search)
  const incoming={source:q.get('utm_source'),medium:q.get('utm_medium'),campaign:q.get('utm_campaign'),content:q.get('utm_content'),country:q.get('utm_country')}
  if(incoming.source||incoming.medium||incoming.campaign||incoming.content||incoming.country){localStorage.setItem(ATTR_KEY,JSON.stringify(incoming));return incoming}
  return JSON.parse(localStorage.getItem(ATTR_KEY)||'{}')
 }catch{return {}}
}
export async function trackWakhReekEvent(eventName,metadata={}){
 if(typeof window==='undefined')return
 const a=getAttribution();let userId=null
 try{const{data}=await supabase.auth.getUser();userId=data?.user?.id||null}catch{}
 let referrerHost=null;try{referrerHost=document.referrer?new URL(document.referrer).hostname:null}catch{}
 await supabase.from('market_analytics_events').insert({event_name:eventName,user_id:userId,session_id:getSession(),country_code:a.country?.toUpperCase()||null,source:a.source||'direct',medium:a.medium||null,campaign:a.campaign||null,content:a.content||null,landing_path:getLanding(),referrer_host:referrerHost,metadata})
}
function trackNewUser(user){if(!user?.id||!user.created_at)return;try{const age=Date.now()-new Date(user.created_at).getTime(),key=`${SIGNUP_KEY}:${user.id}`;if(age>=0&&age<10*60*1000&&!localStorage.getItem(key)){localStorage.setItem(key,'1');trackWakhReekEvent('signup',{method:'supabase_auth'})}}catch{}}
export default function AnalyticsTracker(){
 const pathname=usePathname()
 useEffect(()=>{try{getLanding();if(!sessionStorage.getItem(VISIT_KEY)){sessionStorage.setItem(VISIT_KEY,'1');trackWakhReekEvent('visit',{entry_path:pathname})}}catch{trackWakhReekEvent('visit',{entry_path:pathname})}},[pathname])
 useEffect(()=>{const onClick=e=>{const a=e.target?.closest?.('a[href]');if(a?.getAttribute('href')?.toLowerCase().endsWith('.apk'))trackWakhReekEvent('apk_download',{file:a.getAttribute('href')})};document.addEventListener('click',onClick,true);supabase.auth.getUser().then(({data})=>trackNewUser(data?.user)).catch(()=>{});const{data:listener}=supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN')trackNewUser(session?.user)});return()=>{document.removeEventListener('click',onClick,true);listener?.subscription?.unsubscribe?.()}},[])
 return null
}
