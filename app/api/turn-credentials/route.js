import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const METERED_DOMAIN = 'jamakbl.metered.live'
const FALLBACK_ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
]

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization') || ''
    const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const secretKey = process.env.METERED_SECRET_KEY

    if (!supabaseUrl || !supabaseKey || !secretKey) {
      console.error('TURN endpoint is missing required server environment variables')
      return NextResponse.json({ error: 'TURN service unavailable' }, { status: 503 })
    }

    const authClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a short-lived Metered credential on the server. The permanent
    // METERED_SECRET_KEY never reaches the browser or the repository.
    const createResponse = await fetch(
      `https://${METERED_DOMAIN}/api/v1/turn/credential?secretKey=${encodeURIComponent(secretKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiryInSeconds: 14400,
          label: `wakhreek-${user.id.slice(0, 8)}-${Date.now()}`,
        }),
        cache: 'no-store',
      }
    )

    if (!createResponse.ok) {
      console.error('Metered credential creation failed', createResponse.status)
      return NextResponse.json({ error: 'TURN service unavailable' }, { status: 502 })
    }

    const credential = await createResponse.json()
    if (!credential?.apiKey) {
      return NextResponse.json({ error: 'Invalid TURN response' }, { status: 502 })
    }

    const iceResponse = await fetch(
      `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${encodeURIComponent(credential.apiKey)}&region=global`,
      { cache: 'no-store' }
    )

    if (!iceResponse.ok) {
      console.error('Metered ICE server fetch failed', iceResponse.status)
      return NextResponse.json({ error: 'TURN service unavailable' }, { status: 502 })
    }

    const meteredIceServers = await iceResponse.json()
    const iceServers = Array.isArray(meteredIceServers) && meteredIceServers.length
      ? meteredIceServers
      : FALLBACK_ICE_SERVERS

    return NextResponse.json(
      { iceServers },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('TURN credentials endpoint error', error)
    return NextResponse.json({ error: 'TURN service unavailable' }, { status: 500 })
  }
}
