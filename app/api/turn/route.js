import { NextResponse } from 'next/server'

const FALLBACK_TURN = {
  urls: [
    'turn:openrelay.metered.ca:80',
    'turn:openrelay.metered.ca:443',
    'turn:openrelay.metered.ca:443?transport=tcp',
  ],
  username: 'openrelayproject',
  credential: 'openrelayproject',
}

function preferredUrls(raw) {
  return raw
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .sort((a, b) => {
      const score = url => {
        if (url.startsWith('turns:') && url.includes(':443') && url.includes('transport=tcp')) return 0
        if (url.startsWith('turn:') && url.includes(':443')) return 1
        if (url.includes('transport=tcp')) return 2
        return 3
      }
      return score(a) - score(b)
    })
}

export async function GET() {
  const username = process.env.TURN_USERNAME || ''
  const credential = process.env.TURN_CREDENTIAL || ''
  const urls = preferredUrls(process.env.TURN_URLS || '')

  const iceServers = []

  if (username && credential && urls.length) {
    iceServers.push({ urls, username, credential })
  } else {
    // Temporary public TURN fallback for real-network testing until WakhReek has its own TURN credentials.
    iceServers.push(FALLBACK_TURN)
  }

  iceServers.push(
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
  )

  return NextResponse.json(
    { iceServers, turnEnabled: true },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
