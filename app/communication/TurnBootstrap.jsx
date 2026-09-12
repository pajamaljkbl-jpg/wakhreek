'use client'

import { useEffect } from 'react'

export default function TurnBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) return

    let cancelled = false
    const NativeRTCPeerConnection = window.RTCPeerConnection

    async function configureTurn() {
      try {
        const response = await fetch('/api/turn', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (cancelled || !Array.isArray(data?.iceServers) || !data.iceServers.length) return

        const WrappedRTCPeerConnection = new Proxy(NativeRTCPeerConnection, {
          construct(Target, args) {
            const [configuration = {}, constraints] = args
            return Reflect.construct(Target, [
              { ...configuration, iceServers: data.iceServers },
              constraints,
            ])
          },
        })

        window.RTCPeerConnection = WrappedRTCPeerConnection
      } catch (error) {
        console.log('TURN config unavailable; keeping built-in STUN.', error)
      }
    }

    configureTurn()

    return () => {
      cancelled = true
      if (window.RTCPeerConnection !== NativeRTCPeerConnection) {
        window.RTCPeerConnection = NativeRTCPeerConnection
      }
    }
  }, [])

  return null
}
