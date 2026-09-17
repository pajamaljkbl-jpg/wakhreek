'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const RTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ],
}

export default function CallEngine({ call, me, localStream, onRemoteStream, onError }) {
  const pcRef = useRef(null)

  useEffect(() => {
    if (!call?.id || !me?.id || !localStream || call.status !== 'answered') return

    let cancelled = false
    let signalChannel = null
    const pendingIce = []
    const handledSignals = new Set()
    const pc = new RTCPeerConnection(RTC_CONFIG)
    pcRef.current = pc

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

    pc.ontrack = event => {
      if (cancelled) return
      const stream = event.streams?.[0] || new MediaStream([event.track])
      onRemoteStream?.(stream)
    }

    pc.onicecandidate = async event => {
      if (!event.candidate || cancelled) return
      const { error } = await supabase.from('call_signals').insert({
        call_id: call.id,
        sender_id: me.id,
        signal_type: 'ice',
        payload: event.candidate.toJSON(),
      })
      if (error && !cancelled) onError?.(error.message)
    }

    pc.onconnectionstatechange = () => {
      if (cancelled) return
      if (pc.connectionState === 'failed') onError?.('Connexion audio/vidéo impossible. Réessayez l’appel.')
    }

    async function addIce(payload) {
      if (!payload || cancelled) return
      if (!pc.remoteDescription) {
        pendingIce.push(payload)
        return
      }
      await pc.addIceCandidate(new RTCIceCandidate(payload))
    }

    async function flushIce() {
      while (pendingIce.length && pc.remoteDescription && !cancelled) {
        await pc.addIceCandidate(new RTCIceCandidate(pendingIce.shift()))
      }
    }

    async function sendSignal(type, payload) {
      const { error } = await supabase.from('call_signals').insert({
        call_id: call.id,
        sender_id: me.id,
        signal_type: type,
        payload,
      })
      if (error) throw error
    }

    async function handleSignal(signal) {
      if (cancelled || !signal || signal.sender_id === me.id) return
      if (signal.id != null && handledSignals.has(signal.id)) return
      if (signal.id != null) handledSignals.add(signal.id)

      try {
        if (signal.signal_type === 'offer' && call.caller_id !== me.id) {
          if (pc.signalingState !== 'stable' || pc.remoteDescription) return
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload))
          await flushIce()
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          await sendSignal('answer', pc.localDescription.toJSON())
          return
        }

        if (signal.signal_type === 'answer' && call.caller_id === me.id) {
          if (pc.signalingState !== 'have-local-offer' || pc.remoteDescription) return
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload))
          await flushIce()
          return
        }

        if (signal.signal_type === 'ice') await addIce(signal.payload)
      } catch (error) {
        if (!cancelled) onError?.(error.message)
      }
    }

    async function loadExistingSignals() {
      const { data, error } = await supabase
        .from('call_signals')
        .select('id,call_id,sender_id,signal_type,payload,created_at')
        .eq('call_id', call.id)
        .order('id', { ascending: true })
      if (error) throw error
      for (const signal of data || []) await handleSignal(signal)
    }

    async function boot() {
      signalChannel = supabase
        .channel(`call-signals:${call.id}:${me.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `call_id=eq.${call.id}`,
        }, payload => { handleSignal(payload.new) })
        .subscribe()

      await loadExistingSignals()
      if (cancelled) return

      if (call.caller_id === me.id && pc.signalingState === 'stable' && !pc.localDescription) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await sendSignal('offer', pc.localDescription.toJSON())
      }
    }

    boot().catch(error => { if (!cancelled) onError?.(error.message) })

    return () => {
      cancelled = true
      pendingIce.length = 0
      handledSignals.clear()
      if (signalChannel) supabase.removeChannel(signalChannel)
      pc.ontrack = null
      pc.onicecandidate = null
      pc.onconnectionstatechange = null
      pc.close()
      pcRef.current = null
    }
  }, [call?.id, call?.status, call?.caller_id, me?.id, localStream, onRemoteStream, onError])

  return null
}
