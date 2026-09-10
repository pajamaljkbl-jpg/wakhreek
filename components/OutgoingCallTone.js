'use client'
import {useEffect,useRef} from 'react'
import {usePathname} from 'next/navigation'

export default function OutgoingCallTone(){
 const pathname=usePathname()
 const ctxRef=useRef(null),timerRef=useRef(null),nodesRef=useRef([])
 useEffect(()=>{
  if(pathname!=='/communication')return
  const stop=()=>{if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}nodesRef.current.forEach(n=>{try{n.stop?.()}catch{}try{n.disconnect?.()}catch{}});nodesRef.current=[]}
  const ctx=()=>{if(!ctxRef.current){const A=window.AudioContext||window.webkitAudioContext;if(A)ctxRef.current=new A()}return ctxRef.current}
  const pulse=()=>{const c=ctx();if(!c||c.state!=='running')return;const now=c.currentTime;[440,480].forEach(f=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.055,now+.03);g.gain.setValueAtTime(.055,now+1.0);g.gain.exponentialRampToValueAtTime(.0001,now+1.08);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+1.1);nodesRef.current.push(o,g)})}
  const start=async()=>{const c=ctx();if(!c)return;try{if(c.state==='suspended')await c.resume()}catch{}if(timerRef.current)return;pulse();timerRef.current=setInterval(pulse,3000)}
  const sync=()=>{const text=document.body?.innerText||'';const waiting=text.includes('Appel audio…')||text.includes('Appel vidéo…');const connected=text.includes('Connecté');if(waiting&&!connected)start();else stop()}
  const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  const unlock=()=>{ctx()?.resume?.().catch(()=>{})};window.addEventListener('pointerdown',unlock,{passive:true});sync()
  return()=>{observer.disconnect();window.removeEventListener('pointerdown',unlock);stop();ctxRef.current?.close?.();ctxRef.current=null}
 },[pathname])
 return null
}
