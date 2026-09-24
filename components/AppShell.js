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
  const publicMarket = pathname === '/market' || pathname?.startsWith('/market/boutique/')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        if (!publicMarket) { router.replace('/'); return }
        setSession(null); setLoading(false); return
      }
      setSession(data.session); setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        setSession(null)
        if (!publicMarket) router.replace('/')
      } else setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [router, publicMarket])

  async function signOut() { await supabase.auth.signOut({ scope: 'local' }); router.replace('/') }
  if (loading || (!session && !publicMarket)) return <main className="app-loading" data-no-translate>{t('loading')}</main>
  const name = session?.user?.user_metadata?.display_name || session?.user?.email

  return <main className="app-root">
    <header className="app-topbar">
      <div className="app-brand">
        <span className="app-logo"><img src="/wakhreek-logo.png" alt="WakhReek" /></span>
        <strong>WakhReek</strong>
        <span className="app-search" aria-hidden="true">⌕ <span>Rechercher sur WakhReek...</span></span>
      </div>
      <nav className="app-tabs" aria-label={t('mainNavigation')} data-no-translate>
        <Link className={pathname === '/communication' ? 'active' : ''} href={session?"/communication":"/inscription"}><span className="tab-icon">💬</span>{t('communication')}</Link>
        <Link className={pathname === '/market' ? 'active' : ''} href="/market"><span className="tab-icon">🏪</span>{t('market')}</Link>
        <Link className={pathname === '/social' ? 'active' : ''} href={session?"/social":"/inscription"}><span className="tab-icon">👥</span>WakhReek Social</Link>
      </nav>
      <div className="app-user">{session?<><Link className="app-profile-link" href={'/social/profile/'+session.user.id} title={t('socialMyProfile','My profile')}><span className="app-profile-avatar">{session.user.user_metadata?.avatar_url?<img src={session.user.user_metadata.avatar_url} alt="" />:'WR'}</span><span className="app-user-name" data-user-content>{name}</span></Link><button onClick={signOut} data-no-translate>{t('signOut')}</button></>:<Link className="app-profile-link" href="/inscription">{t('signUp','S’inscrire')}</Link>}</div>
    </header>
    <section className="app-page">
      {title && <div className="app-page-title"><h1>{title}</h1></div>}
      {children}
    </section>
  </main>
}
