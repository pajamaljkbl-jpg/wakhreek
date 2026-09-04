import { createClient } from '@supabase/supabase-js'

let client = null

function getSupabase() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing Supabase public environment variables')
  }

  client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return client
}

// Keep the existing import API while avoiding Supabase initialization during
// Next.js static prerender. The real client is created on first runtime use.
export const supabase = new Proxy({}, {
  get(_target, property) {
    const value = getSupabase()[property]
    return typeof value === 'function' ? value.bind(getSupabase()) : value
  },
})
