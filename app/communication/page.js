'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './communication.module.css'

export default function CommunicationPage() {
  const router = useRouter()
  const [me, setMe] = useState(null)

  useEffect(() => {
    let active = true

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return
      if (error || !data?.user) {
        router.replace('/')
        return
      }
      setMe(data.user)
    })

    return () => {
      active = false
    }
  }, [router])

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>WakhReek</Link>
      </header>

      <nav className={styles.mainNav} aria-label="WakhReek">
        <Link href="/communication">Communication</Link>
        <Link href="/market">Market</Link>
        <Link href="/tv">WakhReek TV</Link>
      </nav>

      <section className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <strong>Communication</strong>
          </div>
        </aside>

        <section className={styles.chat}>
          <header className={styles.chatHeader}>
            <div>
              <strong>{me?.email || 'WakhReek'}</strong>
            </div>
          </header>

          <div className={styles.messages} />

          <div className={styles.composer}>
            <input
              type="text"
              placeholder="Communication WakhReek"
              disabled
              aria-label="Communication WakhReek"
            />
          </div>
        </section>
      </section>
    </main>
  )
}
