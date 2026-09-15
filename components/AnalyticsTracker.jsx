'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

const ATTR_KEY='wakhreek_attribution_v1'
const SESSION_KEY='wakhreek_session_v1'

function getSession(){
  try {
    let id=sessionStorage.getItem(SESSION_KEY)
    if(!id){id=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,id)}
    return id
  } catch { return null }
}

function getAttribution(){
  try {
    const q=new URLSearchParams(location.search)
    const incoming={source:q.get('utm_source'),medium:q.get('utm_medium'),campaign:q.get('utm_campaign'),content:q.get('utm_content')}
    if(incoming.source||incoming.medium||incoming.campaign||incoming.content){
      localStorage.setItem(ATTR_KEY,JSON.stringify(incoming));return incoming
    }
    return JSON.parse(localStorage.getItem(ATTR_KEY)||'{}')
  } catch { return {} }
}

export async function trackWakhReekEvent(eventName, metadata={}){
  if(typeof window==='undefined')return
  const a=getAttribution()
  let userId=null
  try { const {data}=await supabase.auth.getUser(); userId=data?.user?.id||null } catch {}
  let referrerHost=null
  try { referrerHost=document.referrer?new URL(document.referrer).hostname:null } catch {}
  await supabase.from('market_analytics_events').insert({
    event_name:eventName,user_id:userId,session_id:getSession(),source:a.source||null,medium:a.medium||null,
    campaign:a.campaign||null,content:a.content||null,landing_path:location.pathname,referrer_host:referrerHost,metadata
  })
}

export default function AnalyticsTracker(){
  const pathname=usePathname()
  useEffect(()=>{trackWakhReekEvent('visit',{path:pathname})},[pathname])
  return null
}
