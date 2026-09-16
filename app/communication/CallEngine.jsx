'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function CallEngine({ call, me, localStream, onRemoteStream, onError }) {
  const pcRef = useRef(null)
  const pendingIce = useRef([])

  useEffect(() => {
    if (!call?.id || !me?.id || !localStream || call.status !== 'answered') return
    let cancelled = false
    let signalChannel
    const pc = new RTCPeerConnection()
    pcRef.current = pc
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
    pc.ontrack = event => onRemoteStream?.(event.streams?.[0] || new MediaStream([event.track]))
    pc.onicecandidate = async event => {
      if (!event.candidate || cancelled) return
      const { error } = await supabase.from('call_signals').insert({ call_id: call.id, sender_id: me.id, signal_type: 'ice', payload: event.candidate.toJSON() })
      if (error) onError?.(error.message)
    }
    async function addIce(payload) {
      if (!payload) return
      if (!pc.remoteDescription) { pendingIce.current.push(payload); return }
      await pc.addIceCandidate(new RTCIceCandidate(payload))
    }
    async function flushIce() {
      for (const item of pendingIce.current.splice(0)) await pc.addIceCandidate(new RTCIceCandidate(item))
    }
    async function handleSignal(signal) {
      if (cancelled || signal.sender_id === me.id) return
      try {
        if (signal.signal_type === 'offer' && call.caller_id !== me.id) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload))
          await flushIce()
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          const { error } = await supabase.from('call_signals').insert({ call_id: call.id, sender_id: me.id, signal_type: 'answer', payload: pc.localDescription.toJSON() })
          if (error) throw error
        } else if (signal.signal_type === 'answer' && call.caller_id === me.id) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload)); await flushIce()
        } else if (signal.signal_type === 'ice') await addIce(signal.payload)
      } catch (error) { onError?.(error.message) }
    }
    async function boot() {
      const { data, error } = await supabase.from('call_signals').select('id,call_id,sender_id,signal_type,payload,created_at').eq('call_id', call.id).order('id')
      if (error) { onError?.(error.message); return }
      for (const signal of data || []) await handleSignal(signal)
      signalChannel = supabase.channel(`call-signals:${call.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `call_id=eq.${call.id}` }, payload => handleSignal(payload.new)).subscribe()
      if (call.caller_id === me.id && !pc.localDescription && !pc.remoteDescription) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        const { error: offerError } = await supabase.from('call_signals').insert({ call_id: call.id, sender_id: me.id, signal_type: 'offer', payload: pc.localDescription.toJSON() })
        if (offerError) onError?.(offerError.message)
      }
    }
    boot().catch(error => onError?.(error.message))
    return () => {
      cancelled = true; pendingIce.current = []
      if (signalChannel) supabase.removeChannel(signalChannel)
      pc.ontrack = null; pc.onicecandidate = null; pc.close(); pcRef.current = null
    }
  }, [call?.id, call?.status, call?.caller_id, me?.id, localStream, onRemoteStream, onError])

  return null
}
