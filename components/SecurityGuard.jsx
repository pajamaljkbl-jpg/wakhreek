'use client'
import {useEffect} from 'react'
import {usePathname} from 'next/navigation'
import {supabase} from '../lib/supabase'

export default function SecurityGuard(){
 const pathname=usePathname()
 useEffect(()=>{let active=true
  async function watch(){
   if(!pathname?.startsWith('/admin'))return
   let{data:{session}}=await supabase.auth.getSession()
   if(session){const r=await supabase.auth.refreshSession();if(r.data?.session)session=r.data.session}
   const role=session?.user?.app_metadata?.role
   const event_type=role==='admin'?'admin_access_granted':'admin_access_denied'
   if(active) await supabase.rpc('record_security_event',{p_event_type:event_type,p_path:pathname,p_details:{monitor:'wakhreek-security-guard-v1'}})
  }
  watch();return()=>{active=false}
 },[pathname])
 return null
}
