'use client'

import {createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react'
import {supabase} from '../lib/supabase'
import {DEFAULT_LANGUAGE,LANGUAGES,normalizeLanguage,translate} from '../lib/i18n'

const I18nContext=createContext({language:DEFAULT_LANGUAGE,setLanguage:()=>{},t:key=>key,languages:LANGUAGES,ready:false})

function applyDocumentLanguage(language){
 const lang=normalizeLanguage(language)
 document.documentElement.lang=lang
 document.documentElement.dir=lang==='ar'?'rtl':'ltr'
}

export default function I18nProvider({children}){
 const[language,setLanguageState]=useState(DEFAULT_LANGUAGE),[ready,setReady]=useState(false)
 useEffect(()=>{let cancelled=false;(async()=>{let next=DEFAULT_LANGUAGE;try{next=normalizeLanguage(localStorage.getItem('wakhreek_language')||DEFAULT_LANGUAGE)}catch{}try{const{data:{user}}=await supabase.auth.getUser();if(user){const{data}=await supabase.rpc('get_my_preferred_language');if(data)next=normalizeLanguage(data)}}catch{}if(cancelled)return;setLanguageState(next);applyDocumentLanguage(next);try{localStorage.setItem('wakhreek_language',next)}catch{}setReady(true)})();return()=>{cancelled=true}},[])
 const setLanguage=useCallback(async next=>{next=normalizeLanguage(next);setLanguageState(next);applyDocumentLanguage(next);try{localStorage.setItem('wakhreek_language',next)}catch{}try{const{data:{user}}=await supabase.auth.getUser();if(user)await supabase.rpc('set_my_preferred_language',{p_language:next})}catch{}},[])
 const t=useCallback((key,fallback)=>translate(language,key,fallback),[language])
 const value=useMemo(()=>({language,setLanguage,t,languages:LANGUAGES,ready}),[language,setLanguage,t,ready])
 return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(){return useContext(I18nContext)}
