'use client'
import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
import {supabase} from '../lib/supabase'

const KEY='wakhreek_onboarding_assistant_v1'
export default function NewUserAssistant(){
 const router=useRouter(),[open,setOpen]=useState(false),[name,setName]=useState('')
 useEffect(()=>{(async()=>{try{if(localStorage.getItem(KEY))return;const{data}=await supabase.auth.getUser();const u=data?.user;if(!u)return;const age=Date.now()-new Date(u.created_at).getTime();if(age>=0&&age<7*24*60*60*1000){setName(u.user_metadata?.display_name||'');setOpen(true)}}catch{}})()},[])
 function close(){try{localStorage.setItem(KEY,'done')}catch{}setOpen(false)}
 function go(path){close();router.push(path)}
 if(!open)return null
 return <div style={backdrop}><section style={box} role="dialog" aria-modal="true"><button onClick={close} style={x}>×</button><div style={{fontSize:38}}>🤖</div><h2>مرحبًا {name||''} في WakhReek</h2><p>أنا مساعد WakhReek. ماذا تريد أن تفعل الآن؟</p><div style={grid}>
  <button style={choice} onClick={()=>go('/communication')}>💬<b>التواصل</b><small>الأصدقاء، الرسائل والمكالمات</small></button>
  <button style={choice} onClick={()=>go('/market')}>🛍️<b>Market</b><small>البحث عن متجر أو منتج</small></button>
  <button style={choice} onClick={()=>go('/market/create')}>🏪<b>فتح Boutique</b><small>اختر الخطة وابدأ طلب متجرك</small></button>
 </div><p style={{fontSize:12,opacity:.7}}>يمكنك إغلاق المساعد ومتابعة WakhReek بشكل عادي.</p></section></div>
}
const backdrop={position:'fixed',inset:0,background:'rgba(5,18,38,.55)',display:'grid',placeItems:'center',padding:18,zIndex:99999}
const box={position:'relative',width:'min(620px,100%)',background:'#fff',borderRadius:22,padding:24,textAlign:'center',boxShadow:'0 24px 70px rgba(0,0,0,.25)',color:'#172033'}
const x={position:'absolute',right:14,top:10,border:0,background:'transparent',fontSize:28,cursor:'pointer'}
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,margin:'20px 0'}
const choice={border:'1px solid #dbe5f3',background:'#f8fbff',borderRadius:16,padding:18,cursor:'pointer',display:'grid',gap:7,fontSize:24}
