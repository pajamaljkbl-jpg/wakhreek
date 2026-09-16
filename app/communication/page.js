'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './communication.module.css'

function initials(person) {
  const value = person?.display_name || person?.email || 'W'
  return value.trim().split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join('') || 'W'
}

export default function CommunicationPage() {
  const router = useRouter()
  const [me, setMe] = useState(null)
  const [people, setPeople] = useState([])
  const [boutiques, setBoutiques] = useState([])
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  const loadBoutiques = useCallback(async () => {
    const { data, error } = await supabase.from('boutiques')
      .select('id,user_id,name,logo_url,is_live,legal_verification_status')
      .order('name')
    if (error) {
      setStatus(error.message)
      return
    }
    setBoutiques((data || []).filter(shop => shop.user_id))
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!mounted) return
      if (error || !data?.user) {
        router.replace('/')
        return
      }
      setMe(data.user)
      await loadBoutiques()
    })
    return () => { mounted = false }
  }, [router, loadBoutiques])

  useEffect(() => {
    const q = search.trim()
    if (q.length < 2) {
      setPeople([])
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_registered_users', { search_text: q })
      if (cancelled) return
      if (error) {
        setStatus(error.message)
        setPeople([])
        return
      }
      setStatus('')
      setPeople(data || [])
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [search])

  const directory = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = []
    const usedOwners = new Set()

    for (const shop of boutiques) {
      if (shop.user_id === me?.id) continue
      if (q && !`${shop.name || ''}`.toLowerCase().includes(q)) continue
      rows.push({
        id: shop.user_id,
        kind: 'boutique',
        boutique_id: shop.id,
        display_name: shop.name || 'Boutique WakhReek',
        logo_url: shop.logo_url || null,
        email: null
      })
      usedOwners.add(shop.user_id)
    }

    for (const person of people) {
      if (person.id === me?.id || usedOwners.has(person.id)) continue
      rows.push({
        ...person,
        kind: 'person',
        display_name: person.display_name || person.email || 'Utilisateur WakhReek',
        logo_url: person.avatar_url || null
      })
    }
    return rows
  }, [people, boutiques, me, search])

  const loadMessages = useCallback(async id => {
    if (!id) return
    const { data, error } = await supabase.from('messages')
      .select('id,conversation_id,sender_id,body,message_type,created_at')
      .eq('conversation_id', id)
      .eq('message_type', 'text')
      .order('created_at', { ascending: true })
    if (error) {
      setStatus(error.message)
      return
    }
    setMessages(data || [])
  }, [])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    loadMessages(conversationId)
    const channel = supabase.channel(`communication-text:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}`
      }, payload => {
        const message = payload.new
        if (message.message_type !== 'text') return
        setMessages(current => current.some(row => row.id === message.id) ? current : [...current, message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, loadMessages])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function openConversation(person) {
    if (!person?.id || busy) return
    setBusy(true)
    setStatus('')
    const { data, error } = await supabase.rpc('connect_registered_user', { other_user: person.id })
    setBusy(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setActive(person)
    setConversationId(data)
  }

  async function sendMessage(event) {
    event.preventDefault()
    const body = text.trim()
    if (!body || !me || !conversationId || busy) return
    setBusy(true)
    setStatus('')
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: me.id,
      body,
      message_type: 'text'
    }).select('id,conversation_id,sender_id,body,message_type,created_at').single()
    setBusy(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setText('')
    setMessages(current => current.some(row => row.id === data.id) ? current : [...current, data])
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}><div><strong>WakhReek</strong><span>Took Only</span></div></Link>
      </header>

      <nav className={styles.mainNav} aria-label="WakhReek">
        <Link href="/communication" className={styles.navActive}>Communication</Link>
        <Link href="/market">Market</Link>
        <Link href="/tv">WakhReek TV</Link>
      </nav>

      <section className={`${styles.shell} ${active ? styles.hasActive : ''}`}>
        <aside className={styles.sidebar}>
          <div className={styles.searchWrap}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une personne ou une boutique" aria-label="Rechercher une personne ou une boutique" />
          </div>
          <div className={styles.contactList}>
            {directory.map(person => (
              <div className={styles.contactRow} key={`${person.kind}-${person.id}`}>
                <button className={styles.personMain} type="button" onClick={() => openConversation(person)} disabled={busy}>
                  <div className={styles.contactAvatar}>{initials(person)}</div>
                  <div className={styles.contactCopy}>
                    <div><strong>{person.display_name}</strong></div>
                    <p>{person.kind === 'boutique' ? 'Boutique WakhReek' : 'Utilisateur WakhReek'}</p>
                  </div>
                </button>
              </div>
            ))}
            {!directory.length && <div className={styles.empty}>{search.trim().length < 2 ? 'Recherchez un utilisateur ou une boutique' : 'Aucun résultat'}</div>}
          </div>
          <div className={styles.encryption}><strong>WakhReek Communication</strong></div>
        </aside>

        <section className={styles.chat}>
          <header className={styles.chatHeader}>
            {active ? (
              <div className={styles.chatIdentity}>
                <button className={styles.mobileBack} type="button" onClick={() => { setActive(null); setConversationId(null); setText('') }}>‹</button>
                <div className={styles.avatarMedium}>{initials(active)}</div>
                <div><strong>{active.display_name}</strong><span>{active.kind === 'boutique' ? 'Boutique WakhReek' : 'WakhReek'}</span></div>
              </div>
            ) : <strong>Communication</strong>}
          </header>

          <div className={styles.messages}>
            {!active && <div className={styles.welcome}>Choisissez une personne ou une boutique.</div>}
            {active && !messages.length && !status && <div className={styles.welcome}>Commencez la conversation.</div>}
            {messages.map(message => (
              <div key={message.id} className={`${styles.messageRow} ${message.sender_id === me?.id ? styles.mine : ''}`}>
                <div className={`${styles.bubble} ${message.sender_id === me?.id ? styles.bubbleMine : ''}`}>
                  <p>{message.body}</p>
                  <time>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
              </div>
            ))}
            {status && <div className={styles.status}>{status}</div>}
            <div ref={endRef} />
          </div>

          <form className={styles.composer} onSubmit={sendMessage}>
            <input value={text} onChange={e => setText(e.target.value)} type="text" placeholder={active ? 'Écrire un message' : 'Choisissez un contact'} disabled={!active || !conversationId || busy} aria-label="Message" />
            {active && conversationId && <button className={styles.send} type="submit" disabled={!text.trim() || busy} aria-label="Envoyer">➤</button>}
          </form>
        </section>
      </section>
    </main>
  )
}
