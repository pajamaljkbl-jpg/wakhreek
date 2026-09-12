'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useI18n } from './I18nProvider'

export default function AppShell({ children, title }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/'); return }
      setSession(data.session); setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) router.replace('/')
      else setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [router])

  async function signOut() { await supabase.auth.signOut({ scope: 'local' }); router.replace('/') }
  if (loading || !session) return <main className="app-loading" data-no-translate>{t('loading')}</main>
  const name = session.user.user_metadata?.display_name || session.user.email

  return <main className="app-root">
    <header className="app-topbar">
      <div className="app-brand"><span className="app-logo">wR</span><strong>WakhReek -Onley Took</strong></div>
      <div className="app-user"><span data-user-content>{name}</span><button onClick={signOut} data-no-translate>{t('signOut')}</button></div>
    </header>
    <nav className="app-tabs" aria-label={t('mainNavigation')} data-no-translate>
      <Link className={pathname === '/communication' ? 'active' : ''} href="/communication">{t('communication')}</Link>
      <Link className={pathname === '/market' ? 'active' : ''} href="/market">{t('market')}</Link>
      <Link className={pathname === '/tv' ? 'active' : ''} href="/tv">{t('tv')}</Link>
    </nav>
    <section className="app-page">
      {title && <div className="app-page-title"><h1>{title}</h1></div>}
      {children}
    </section>
  </main>
}
