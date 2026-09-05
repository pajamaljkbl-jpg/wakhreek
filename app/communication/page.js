'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './communication.module.css'

export default function CommunicationPage() {
  const router = useRouter()
  const [me, setMe] = useState(null)
  const [people, setPeople] = useState([])
  const [conversationMeta, setConversationMeta] = useState({})
  const [activePerson, setActivePerson] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('toutes')
  const [status, setStatus] = useState('')
  const messagesEndRef = useRef(null)

  const refreshSidebar = useCallback(async (user) => {
    if (!user) return

    const { data: foundPeople, error: peopleError } = await supabase.rpc('find_people', { search_text: '' })
    if (peopleError) {
      setStatus(peopleError.message)
      return
    }

    const contacts = foundPeople || []
    setPeople(contacts)

    const { data: memberRows } = await supabase
      .from('conversation_members')
      .select('conversation_id,user_id')

    const rows = memberRows || []
    const otherMemberByConversation = new Map()
    rows.forEach((row) => {
      if (row.user_id !== user.id) otherMemberByConversation.set(row.conversation_id, row.user_id)
    })

    const conversationIds = [...otherMemberByConversation.keys()]
    if (!conversationIds.length) {
      setConversationMeta({})
      return
    }

    const { data: latestRows } = await supabase
      .from('messages')
      .select('conversation_id,body,message_type,created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    const latestByConversation = new Map()
    ;(latestRows || []).forEach((message) => {
      if (!latestByConversation.has(message.conversation_id)) {
        latestByConversation.set(message.conversation_id, message)
      }
    })

    const meta = {}
    otherMemberByConversation.forEach((otherUserId, id) => {
      meta[otherUserId] = { id, latest: latestByConversation.get(id) || null }
    })
    setConversationMeta(meta)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data?.user) {
        router.replace('/')
        return
      }
      setMe(data.user)
      refreshSidebar(data.user)
    })
  }, [refreshSidebar, router])

  const loadMessages = useCallback(async (id) => {
    if (!id) return
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      setStatus(error.message)
      return
    }
    setMessages(data || [])
  }, [])

  useEffect(() => {
    if (!conversationId) return

    loadMessages(conversationId)
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => current.some((item) => item.id === payload.new.id) ? current : [...current, payload.new])
          if (me) refreshSidebar(me)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, loadMessages, me, refreshSidebar])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const visiblePeople = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = people.filter((person) => {
      if (!q) return true
      return (person.display_name || '').toLowerCase().includes(q) || (person.email || '').toLowerCase().includes(q)
    })

    if (filter === 'groupes') return []
    if (filter === 'non-lues' || filter === 'favoris') return list

    return [...list].sort((a, b) => {
      const aDate = conversationMeta[a.id]?.latest?.created_at || ''
      const bDate = conversationMeta[b.id]?.latest?.created_at || ''
      return bDate.localeCompare(aDate)
    })
  }, [people, search, filter, conversationMeta])

  async function openConversation(person) {
    setStatus('')
    const existing = conversationMeta[person.id]?.id
    let id = existing

    if (!id) {
      const { data, error } = await supabase.rpc('start_direct_conversation', { other_user: person.id })
      if (error) {
        setStatus(error.message)
        return
      }
      id = data
      setConversationMeta((current) => ({ ...current, [person.id]: { id, latest: null } }))
    }

    setActivePerson(person)
    setConversationId(id)
  }

  async function sendMessage(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !conversationId || !me) return

    setText('')
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: me.id,
      body,
      message_type: 'text',
    })

    if (error) {
      setText(body)
      setStatus(error.message)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  function formatTime(value) {
    if (!value) return ''
    return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  function initials(person) {
    return (person?.display_name || person?.email || 'WR').slice(0, 2).toUpperCase()
  }

  function latestLabel(person) {
    const latest = conversationMeta[person.id]?.latest
    if (!latest) return 'Démarrer une discussion'
    if (latest.message_type === 'audio') return '🎙 Message vocal'
    if (latest.message_type === 'image') return '📷 Photo'
    if (latest.message_type === 'video') return '🎥 Vidéo'
    return latest.body || 'Message'
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <img src="/wakhreek-logo.svg" alt="WakhReek" className={styles.logo} />
          <div><strong>WakhReek</strong><span>- Onley Took</span></div>
        </div>

        <div className={styles.topActions}>
          <button type="button" className={styles.iconButton} onClick={() => me && refreshSidebar(me)} aria-label="Actualiser">↻</button>
          <span className={styles.topDivider} />
          <div className={styles.meBlock}>
            <div className={styles.avatarSmall}>{initials({ display_name: me?.user_metadata?.display_name, email: me?.email })}</div>
            <div><strong>{me?.user_metadata?.display_name || me?.user_metadata?.full_name || me?.email || 'WakhReek'}</strong><span>En ligne</span></div>
          </div>
          <span className={styles.topDivider} />
          <button type="button" className={styles.logout} onClick={signOut}>↪ Déconnexion</button>
        </div>
      </header>

      <div className={`${styles.shell} ${activePerson ? styles.hasActive : ''}`}>
        <aside className={styles.sidebar}>
          <div className={styles.searchWrap}>
            <span>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher ou démarrer une discussion" />
          </div>

          <div className={styles.filters}>
            {[
              ['toutes', 'Toutes'],
              ['non-lues', 'Non lues'],
              ['favoris', 'Favoris'],
              ['groupes', 'Groupes'],
            ].map(([key, label]) => (
              <button type="button" key={key} className={filter === key ? styles.filterActive : ''} onClick={() => setFilter(key)}>{label}</button>
            ))}
          </div>

          <div className={styles.contactList}>
            {visiblePeople.map((person) => (
              <button type="button" key={person.id} className={`${styles.contactRow} ${activePerson?.id === person.id ? styles.contactActive : ''}`} onClick={() => openConversation(person)}>
                <div className={styles.contactAvatar}>{initials(person)}<i /></div>
                <div className={styles.contactCopy}>
                  <div><strong>{person.display_name || 'Utilisateur WakhReek'}</strong><time>{formatTime(conversationMeta[person.id]?.latest?.created_at)}</time></div>
                  <p>{latestLabel(person)}</p>
                </div>
              </button>
            ))}
            {!visiblePeople.length && <p className={styles.empty}>Aucune conversation</p>}
          </div>

          <div className={styles.encryption}>🔒 Vos messages personnels sont <strong>protégés</strong></div>
        </aside>

        <main className={styles.chat}>
          <header className={styles.chatHeader}>
            <button type="button" className={styles.mobileBack} onClick={() => { setActivePerson(null); setConversationId(null); setMessages([]) }} aria-label="Retour">←</button>
            <div className={styles.chatIdentity}>
              <div className={styles.avatarMedium}>{initials(activePerson)}</div>
              <div><strong>{activePerson?.display_name || 'WakhReek Communication'}</strong><span>{activePerson ? 'En ligne' : 'Choisissez un contact'}</span></div>
            </div>
            <div className={styles.chatActions}>
              <button type="button" title="Rechercher">⌕</button>
              <button type="button" title="Appel vocal" disabled>☎</button>
              <button type="button" title="Appel vidéo" disabled>▣</button>
              <button type="button" title="Plus">⋮</button>
            </div>
          </header>

          <section className={styles.messages}>
            {!activePerson && <div className={styles.welcome}>Choisissez une discussion pour commencer.</div>}
            {messages.map((message) => {
              const mine = message.sender_id === me?.id
              return (
                <div className={`${styles.messageRow} ${mine ? styles.mine : ''}`} key={message.id}>
                  <div className={`${styles.bubble} ${mine ? styles.bubbleMine : ''}`}>
                    {message.message_type === 'audio' && message.media_url ? (
                      <audio controls src={message.media_url} className={styles.audio} />
                    ) : (
                      <p>{message.body}</p>
                    )}
                    <time>{formatTime(message.created_at)} {mine ? '✓✓' : ''}</time>
                  </div>
                </div>
              )
            })}
            {status && <div className={styles.status}>{status}</div>}
            <div ref={messagesEndRef} />
          </section>

          <form className={styles.composer} onSubmit={sendMessage}>
            <button type="button" disabled>☺</button>
            <button type="button" disabled>⌕</button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={activePerson ? 'Message' : 'Choisissez une conversation'} disabled={!activePerson} />
            <button type="button" disabled>📎</button>
            <button type="button" disabled>📷</button>
            <button type="submit" className={styles.send} disabled={!activePerson || !text.trim()}>➤</button>
          </form>
        </main>
      </div>
    </div>
  )
}
