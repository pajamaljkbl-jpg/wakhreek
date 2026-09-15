'use client'

import { useEffect } from 'react'

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export default function TurnBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) return

    let cancelled = false
    let iceServers = DEFAULT_ICE_SERVERS
    const NativeRTCPeerConnection = window.RTCPeerConnection

    // Install the wrapper immediately. Previously it was installed only after
    // /api/turn returned, so a fast tap on Audio/Video could create a peer with
    // STUN only and never receive the TURN configuration.
    const WrappedRTCPeerConnection = new Proxy(NativeRTCPeerConnection, {
      construct(Target, args) {
        const [configuration = {}, constraints] = args
        const configured = Array.isArray(iceServers) && iceServers.length
          ? iceServers
          : DEFAULT_ICE_SERVERS
        return Reflect.construct(Target, [
          { ...configuration, iceServers: configured },
          constraints,
        ])
      },
    })

    window.RTCPeerConnection = WrappedRTCPeerConnection

    async function configureTurn() {
      try {
        const response = await fetch('/api/turn', { cache: 'no-store' })
        if (!response.ok) throw new Error(`TURN HTTP ${response.status}`)
        const data = await response.json()
        if (cancelled) return
        if (Array.isArray(data?.iceServers) && data.iceServers.length) {
          iceServers = data.iceServers
        }
      } catch (error) {
        console.log('TURN config unavailable; keeping STUN fallback.', error)
      }
    }

    configureTurn()

    return () => {
      cancelled = true
      if (window.RTCPeerConnection === WrappedRTCPeerConnection) {
        window.RTCPeerConnection = NativeRTCPeerConnection
      }
    }
  }, [])

  return null
}
