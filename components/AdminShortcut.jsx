'use client'

import Link from 'next/link'
import {useEffect,useState} from 'react'
import {usePathname} from 'next/navigation'
import {supabase} from '../lib/supabase'
import {useI18n} from './I18nProvider'

const labels={ar:'الإدارة',fr:'Admin',en:'Admin',pt:'Admin'}

export default function AdminShortcut(){
  const pathname=usePathname()
  const {language}=useI18n()
  const [isAdmin,setIsAdmin]=useState(false)

  useEffect(()=>{
    let alive=true
    const sync=async()=>{
      const {data}=await supabase.auth.getSession()
      let session=data?.session||null
      if(session){
        const refreshed=await supabase.auth.refreshSession()
        if(refreshed?.data?.session) session=refreshed.data.session
      }
      if(alive)setIsAdmin(session?.user?.app_metadata?.role==='admin')
    }
    sync()
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(alive)setIsAdmin(session?.user?.app_metadata?.role==='admin')
    })
    return()=>{alive=false;listener.subscription.unsubscribe()}
  },[])

  if(!isAdmin||pathname?.startsWith('/admin'))return null
  return <Link href="/admin" aria-label={labels[language]||labels.en} style={button}>⚙ {labels[language]||labels.en}</Link>
}

const button={position:'fixed',right:18,top:86,zIndex:12000,textDecoration:'none',background:'#111827',color:'#fff',border:'2px solid #f4a900',borderRadius:12,padding:'9px 13px',fontWeight:800,boxShadow:'0 5px 18px #0003'}
