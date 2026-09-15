'use client'

import { useEffect } from 'react'

const FALLBACK_ICE_SERVERS = [
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export default function TurnBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) return

    let cancelled = false
    // Start with a relay-capable configuration immediately. The previous version
    // started STUN-only while /api/turn was loading, so the first call could be
    // created without any relay candidate on real phone networks.
    let iceServers = FALLBACK_ICE_SERVERS
    const NativeRTCPeerConnection = window.RTCPeerConnection

    const WrappedRTCPeerConnection = new Proxy(NativeRTCPeerConnection, {
      construct(Target, args) {
        const [configuration = {}, constraints] = args
        const configured = Array.isArray(iceServers) && iceServers.length
          ? iceServers
          : FALLBACK_ICE_SERVERS
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
        console.log('TURN config unavailable; keeping relay fallback.', error)
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
