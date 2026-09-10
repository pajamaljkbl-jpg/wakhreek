'use client'

import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'

export const WAKHREEK_LANGUAGES=[
 ['fr','🇫🇷','Français'],['ar','🇲🇦','العربية'],['en','🇬🇧','English'],
 ['es','🇪🇸','Español'],['pt','🇵🇹','Português'],['de','🇩🇪','Deutsch'],['nl','🇳🇱','Nederlands']
]

function applyDocumentLanguage(lang){
 const root=document.documentElement
 root.lang=lang
 root.dir=lang==='ar'?'rtl':'ltr'
 window.dispatchEvent(new CustomEvent('wakhreek-language-change',{detail:{language:lang}}))
}

export default function LanguageSwitcher(){
 const [lang,setLang]=useState('fr')
 const [ready,setReady]=useState(false)

 useEffect(()=>{
  let cancelled=false
  async function load(){
   let next='fr'
   try{next=localStorage.getItem('wakhreek_language')||'fr'}catch{}
   try{
    const{data:{user}}=await supabase.auth.getUser()
    if(user){const{data}=await supabase.rpc('get_my_preferred_language');if(data)next=data}
   }catch{}
   if(!WAKHREEK_LANGUAGES.some(x=>x[0]===next))next='fr'
   if(cancelled)return
   setLang(next);applyDocumentLanguage(next);setReady(true)
   try{localStorage.setItem('wakhreek_language',next)}catch{}
  }
  load()
  return()=>{cancelled=true}
 },[])

 async function change(e){
  const next=e.target.value
  setLang(next);applyDocumentLanguage(next)
  try{localStorage.setItem('wakhreek_language',next)}catch{}
  try{const{data:{user}}=await supabase.auth.getUser();if(user)await supabase.rpc('set_my_preferred_language',{p_language:next})}catch{}
 }

 return <div className="wr-language" title="Language / Langue">
  <select value={lang} onChange={change} aria-label="Language" disabled={!ready}>
   {WAKHREEK_LANGUAGES.map(([code,flag,name])=><option value={code} key={code}>{flag} {name}</option>)}
  </select>
  <style jsx>{`.wr-language{position:fixed;right:14px;top:12px;z-index:10050}.wr-language select{max-width:155px;border:1px solid #d7e0eb;border-radius:10px;background:#fff;color:#172033;padding:8px 9px;font-weight:700;box-shadow:0 3px 14px #00000018;cursor:pointer}@media(max-width:700px){.wr-language{right:8px;top:8px}.wr-language select{max-width:118px;padding:7px 5px;font-size:12px}}`}</style>
 </div>
}
