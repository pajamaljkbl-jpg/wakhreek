'use client'
import {useEffect,useRef} from 'react'
import {usePathname} from 'next/navigation'
import {supabase} from '../lib/supabase'

export default function OutgoingCallTone(){
 const pathname=usePathname()
 const ctxRef=useRef(null),timerRef=useRef(null),nodesRef=useRef([]),ringingRef=useRef(false)
 useEffect(()=>{
  if(pathname!=='/communication')return
  let cancelled=false,poll=null,userId=null

  const stop=()=>{ringingRef.current=false;if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}nodesRef.current.forEach(n=>{try{n.stop?.()}catch{}try{n.disconnect?.()}catch{}});nodesRef.current=[]}
  const ctx=()=>{if(!ctxRef.current){const A=window.AudioContext||window.webkitAudioContext;if(A)ctxRef.current=new A()}return ctxRef.current}
  const pulse=()=>{const c=ctx();if(!c||c.state!=='running'||!ringingRef.current)return;const now=c.currentTime;[440,480].forEach(f=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.055,now+.03);g.gain.setValueAtTime(.055,now+1.0);g.gain.exponentialRampToValueAtTime(.0001,now+1.08);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+1.1);nodesRef.current.push(o,g)})}
  const start=async()=>{if(ringingRef.current)return;ringingRef.current=true;const c=ctx();if(!c)return;try{if(c.state==='suspended')await c.resume()}catch{}pulse();timerRef.current=setInterval(pulse,3000)}
  const setWaiting=waiting=>{if(waiting)start();else stop()}

  async function sync(){
   if(!userId||cancelled)return
   const{data,error}=await supabase.from('call_sessions').select('id,status').eq('caller_id',userId).eq('status','ringing').order('created_at',{ascending:false}).limit(1)
   if(cancelled)return
   if(error){stop();return}
   setWaiting(!!data?.length)
  }

  const unlock=()=>{ctx()?.resume?.().catch(()=>{})}
  window.addEventListener('pointerdown',unlock,{passive:true})
  window.addEventListener('keydown',unlock)

  let channel=null
  ;(async()=>{
   const{data}=await supabase.auth.getUser()
   if(cancelled||!data?.user)return
   userId=data.user.id
   await sync()
   poll=setInterval(sync,1500)
   channel=supabase.channel(`outgoing-ringback:${userId}`).on('postgres_changes',{event:'*',schema:'public',table:'call_sessions'},payload=>{
    const row=payload.new||payload.old
    if(row?.caller_id===userId)sync()
   }).subscribe()
  })()

  return()=>{cancelled=true;if(poll)clearInterval(poll);if(channel)supabase.removeChannel(channel);window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);stop();ctxRef.current?.close?.();ctxRef.current=null}
 },[pathname])
 return null
}
