'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = "BAaIzBNTHgNIiJF6-kX4Lf9nvhOsQqiiohQdJJyFKb1jkT4dVbOLmTyqtA5h1B_QwqVeHaiNYjgohVq_UIe2L2M";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function PushRegistrar() {
  const [user, setUser] = useState(null)
  const [needsPermission, setNeedsPermission] = useState(false)
  const [busy, setBusy] = useState(false)
  const inFlightRef = useRef(false)
  const ringContextRef = useRef(null)
  const ringTimerRef = useRef(null)

  function getRingContext() {
    if (typeof window === 'undefined') return null
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    if (!ringContextRef.current) ringContextRef.current = new AudioCtx()
    return ringContextRef.current
  }

  async function unlockRingAudio() {
    const ctx = getRingContext()
    if (ctx?.state === 'suspended') {
      try { await ctx.resume() } catch {}
    }
  }

  function stopGlobalRing() {
    if (ringTimerRef.current) clearInterval(ringTimerRef.current)
    ringTimerRef.current = null
    if (navigator.vibrate) navigator.vibrate(0)
  }

  function ringOnce() {
    const ctx = getRingContext()
    if (!ctx || ctx.state !== 'running') return
    const now = ctx.currentTime
    ;[[659.25,0,.28],[783.99,.34,.28],[987.77,.68,.38],[783.99,1.18,.24],[987.77,1.5,.42]].forEach(([frequency,offset,duration]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, now + offset)
      gain.gain.setValueAtTime(.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(.16, now + offset + .025)
      gain.gain.exponentialRampToValueAtTime(.0001, now + offset + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + duration + .03)
    })
    if (navigator.vibrate) navigator.vibrate([250,100,250,350,500])
  }

  async function startGlobalRing() {
    stopGlobalRing()
    await unlockRingAudio()
    ringOnce()
    ringTimerRef.current = setInterval(ringOnce, 2400)
    window.setTimeout(stopGlobalRing, 45000)
  }

  async function saveSubscription(currentUser, askPermission = false) {
    if (!currentUser || inFlightRef.current) return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return
    inFlightRef.current = true
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      let permission = Notification.permission
      if (permission === 'default' && askPermission) permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setNeedsPermission(permission === 'default')
        return
      }

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
      }
      const payload = sub.toJSON()
      if (!payload?.endpoint) return

      const { data: existing, error: lookupError } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', currentUser.id)
        .contains('subscription', { endpoint: payload.endpoint })
        .limit(1)
        .maybeSingle()
      if (lookupError) throw lookupError

      if (existing?.id) {
        const { error } = await supabase.from('push_subscriptions').update({ subscription: payload }).eq('id', existing.id).eq('user_id', currentUser.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('push_subscriptions').insert({ user_id: currentUser.id, subscription: payload })
        if (error && error.code !== '23505') throw error
      }
      setNeedsPermission(false)
    } catch (e) {
      console.log('Push registration error', e)
    } finally {
      inFlightRef.current = false
      setBusy(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(e => console.log('Service worker registration error', e))

    const unlock = () => unlockRingAudio()
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)

    const onServiceWorkerMessage = event => {
      if (event?.data?.type !== 'INCOMING_CALL_WAKE') return
      startGlobalRing()
    }
    if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', onServiceWorkerMessage)

    const syncUser = currentUser => {
      setUser(currentUser || null)
      if (!currentUser || typeof Notification === 'undefined') return
      if (Notification.permission === 'granted') saveSubscription(currentUser, false)
      else if (Notification.permission === 'default') setNeedsPermission(true)
      else setNeedsPermission(false)
    }

    supabase.auth.getUser().then(({ data }) => syncUser(data?.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => syncUser(session?.user))
    return () => {
      listener?.subscription?.unsubscribe()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('message', onServiceWorkerMessage)
      stopGlobalRing()
      ringContextRef.current?.close?.()
    }
  }, [])

  if (!user || !needsPermission) return null

  return <div style={{position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',zIndex:10000,width:'min(92vw,430px)',background:'#071426',color:'#fff',border:'1px solid #1d4ed8',borderRadius:'14px',padding:'12px 14px',boxShadow:'0 12px 34px #0008',display:'flex',alignItems:'center',gap:'12px'}}>
    <div style={{flex:1,fontSize:'14px',lineHeight:1.35}}><strong>☎ مكالمات WakhReek</strong><br/><span style={{opacity:.86}}>فعّل الإشعارات لكي يرن الهاتف عند وصول مكالمة صوتية أو فيديو.</span></div>
    <button type="button" disabled={busy} onClick={()=>saveSubscription(user,true)} style={{border:0,borderRadius:'10px',padding:'10px 13px',fontWeight:800,cursor:'pointer',background:'#2563eb',color:'#fff'}}>{busy?'…':'تفعيل'}</button>
  </div>
}
