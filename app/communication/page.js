'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './communication.module.css'

export default function CommunicationPage() {
  const router = useRouter()
  const [me, setMe] = useState(null)
  const [people, setPeople] = useState([])
  const [friendIds, setFriendIds] = useState(new Set())
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [conversationMeta, setConversationMeta] = useState({})
  const [activePerson, setActivePerson] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('toutes')
  const [status, setStatus] = useState('')
  const [recording, setRecording] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const messagesEndRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const audioChunksRef = useRef([])

  const withSignedMedia = useCallback(async (message) => {
    if (message?.message_type !== 'audio' || !message?.storage_path) return message
    const { data, error } = await supabase.storage.from('communication-media').createSignedUrl(message.storage_path, 3600)
    if (error || !data?.signedUrl) return message
    return { ...message, media_url: data.signedUrl }
  }, [])

  const refreshSidebar = useCallback(async (user) => {
    if (!user) return
    setStatus('')

    const { data: foundPeople, error: peopleError } = await supabase.rpc('find_people', { search_text: '' })
    if (peopleError) { setStatus(peopleError.message); return }
    setPeople(foundPeople || [])

    const [friendsResult, requestsResult, membersResult] = await Promise.all([
      supabase.from('friends').select('friend_id'),
      supabase.from('friend_requests').select('id,sender_id,receiver_id,status,created_at').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('conversation_members').select('conversation_id,user_id'),
    ])

    if (friendsResult.error) { setStatus(friendsResult.error.message); return }
    if (requestsResult.error) { setStatus(requestsResult.error.message); return }
    if (membersResult.error) { setStatus(membersResult.error.message); return }

    setFriendIds(new Set((friendsResult.data || []).map((row) => row.friend_id)))
    const requestRows = requestsResult.data || []
    setIncomingRequests(requestRows.filter((row) => row.receiver_id === user.id))
    setOutgoingRequests(requestRows.filter((row) => row.sender_id === user.id))

    const rows = membersResult.data || []
    const otherMemberByConversation = new Map()
    rows.forEach((row) => {
      if (row.user_id !== user.id) otherMemberByConversation.set(row.conversation_id, row.user_id)
    })

    const conversationIds = [...otherMemberByConversation.keys()]
    if (!conversationIds.length) { setConversationMeta({}); return }

    const { data: latestRows, error: latestError } = await supabase
      .from('messages')
      .select('conversation_id,body,message_type,created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    if (latestError) { setStatus(latestError.message); return }

    const latestByConversation = new Map()
    ;(latestRows || []).forEach((message) => {
      if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, message)
    })

    const meta = {}
    otherMemberByConversation.forEach((otherUserId, id) => {
      meta[otherUserId] = { id, latest: latestByConversation.get(id) || null }
    })
    setConversationMeta(meta)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data?.user) { router.replace('/'); return }
      setMe(data.user)
      refreshSidebar(data.user)
    })
  }, [refreshSidebar, router])

  const loadMessages = useCallback(async (id) => {
    if (!id) return
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true })
    if (error) { setStatus(error.message); return }
    const hydrated = await Promise.all((data || []).map(withSignedMedia))
    setMessages(hydrated)
  }, [withSignedMedia])

  useEffect(() => {
    if (!conversationId) return
    loadMessages(conversationId)
    const channel = supabase.channel(`messages:${conversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, async (payload) => {
      const nextMessage = await withSignedMedia(payload.new)
      setMessages((current) => current.some((item) => item.id === nextMessage.id ? true : false) ? current : [...current, nextMessage])
      if (me) refreshSidebar(me)
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, loadMessages, me, refreshSidebar, withSignedMedia])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => () => { mediaStreamRef.current?.getTracks().forEach((track) => track.stop()) }, [])

  const incomingBySender = useMemo(() => new Map(incomingRequests.map((request) => [request.sender_id, request])), [incomingRequests])
  const outgoingByReceiver = useMemo(() => new Map(outgoingRequests.map((request) => [request.receiver_id, request])), [outgoingRequests])
  const peopleById = useMemo(() => new Map(people.map((person) => [person.id, person])), [people])

  const visiblePeople = useMemo(() => {
    if (filter === 'demandes' || filter === 'groupes') return []
    const q = search.trim().toLowerCase()
    let list

    if (q) {
      list = people.filter((person) =>
        person.id !== me?.id && (
          (person.display_name || '').toLowerCase().includes(q) ||
          (person.email || '').toLowerCase().includes(q)
        )
      )
    } else {
      list = people.filter((person) => friendIds.has(person.id) || Boolean(conversationMeta[person.id]))
    }

    if (filter === 'amis') list = list.filter((person) => friendIds.has(person.id))

    return [...list].sort((a, b) =>
      (conversationMeta[b.id]?.latest?.created_at || '').localeCompare(conversationMeta[a.id]?.latest?.created_at || '')
    )
  }, [people, search, filter, conversationMeta, friendIds, me])

  async function sendFriendRequest(person) {
    if (!me || !person || person.id === me.id || friendIds.has(person.id) || outgoingByReceiver.has(person.id)) return
    setStatus('')
    const { error } = await supabase.from('friend_requests').insert({ sender_id: me.id, receiver_id: person.id })
    if (error) { setStatus(`Invitation: ${error.message}`); return }
    setStatus(`Invitation envoyée à ${person.display_name || person.email}.`)
    await refreshSidebar(me)
  }

  async function respondFriendRequest(requestId, acceptRequest) {
    if (!me) return
    setStatus('')
    const { error } = await supabase.rpc('respond_friend_request', { request_id: requestId, accept_request: acceptRequest })
    if (error) { setStatus(`Invitation: ${error.message}`); return }
    setStatus(acceptRequest ? 'Ami ajouté ✅' : 'Invitation refusée.')
    await refreshSidebar(me)
    if (acceptRequest) setFilter('amis')
  }

  async function openConversation(person) {
    setStatus('')
    const existing = conversationMeta[person.id]?.id
    if (!existing && !friendIds.has(person.id)) {
      setStatus('Ajoutez cette personne comme ami avant de démarrer une discussion.')
      return
    }

    let id = existing
    if (!id) {
      const { data, error } = await supabase.rpc('start_direct_conversation', { other_user: person.id })
      if (error) { setStatus(error.message); return }
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
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: me.id, body, message_type: 'text' })
    if (error) { setText(body); setStatus(error.message) }
  }

  async function startVoiceRecording() {
    if (!activePerson || !conversationId || !me || recording || uploadingAudio) return
    setStatus('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus("L'enregistrement audio n'est pas supporté sur ce navigateur.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioChunksRef.current = []
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
      const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || ''
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => { if (event.data?.size) audioChunksRef.current.push(event.data) }
      recorder.onstop = async () => {
        setRecording(false)
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        const actualType = recorder.mimeType || mimeType || 'audio/webm'
        const baseType = actualType.split(';')[0]
        const extension = baseType.includes('ogg') ? 'ogg' : baseType.includes('mpeg') ? 'mp3' : 'webm'
        const blob = new Blob(audioChunksRef.current, { type: actualType })
        audioChunksRef.current = []
        if (!blob.size) { setStatus('Enregistrement audio vide. Réessayez.'); return }

        setUploadingAudio(true)
        const path = `${conversationId}/${me.id}/${Date.now()}.${extension}`
        const { error: uploadError } = await supabase.storage.from('communication-media').upload(path, blob, { contentType: baseType, upsert: false })
        if (uploadError) { setUploadingAudio(false); setStatus(`Audio: ${uploadError.message}`); return }

        const { error: messageError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: me.id,
          body: 'Message vocal',
          message_type: 'audio',
          storage_path: path,
          media_url: null,
        })
        setUploadingAudio(false)
        if (messageError) setStatus(`Message vocal: ${messageError.message}`)
      }

      recorder.start()
      setRecording(true)
    } catch (error) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      setRecording(false)
      setStatus(error?.name === 'NotAllowedError' ? "Autorisez le microphone pour envoyer un message vocal." : `Microphone: ${error?.message || 'erreur inconnue'}`)
    }
  }

  function stopVoiceRecording() {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  async function signOut() { await supabase.auth.signOut(); router.replace('/') }
  function formatTime(value) { if (!value) return ''; return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
  function initials(person) { return (person?.display_name || person?.email || 'WR').slice(0, 2).toUpperCase() }
  function latestLabel(person) {
    const latest = conversationMeta[person.id]?.latest
    if (!latest) return friendIds.has(person.id) ? 'Ami WakhReek' : 'Démarrer une discussion'
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

      <nav className={styles.mainNav} aria-label="Navigation WakhReek">
        <Link className={styles.navActive} href="/communication">💬 Communication</Link>
        <Link href="/market">🛍 Market</Link>
        <Link href="/tv">📺 WakhReek TV</Link>
      </nav>

      <div className={`${styles.shell} ${activePerson ? styles.hasActive : ''}`}>
        <aside className={styles.sidebar}>
          <div className={styles.searchWrap}><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un ami ou un utilisateur" /></div>
          <div className={styles.filters}>{[
            ['toutes','Toutes'],
            ['amis','Amis'],
            ['demandes', incomingRequests.length ? `Demandes (${incomingRequests.length})` : 'Demandes'],
            ['groupes','Groupes'],
          ].map(([key,label]) => <button type="button" key={key} className={filter === key ? styles.filterActive : ''} onClick={() => { setFilter(key); if (key === 'demandes') setSearch('') }}>{label}</button>)}</div>

          <div className={styles.contactList}>
            {filter === 'demandes' ? (
              incomingRequests.length ? incomingRequests.map((request) => {
                const person = peopleById.get(request.sender_id)
                if (!person) return null
                return <div className={styles.requestRow} key={request.id}>
                  <div className={styles.contactAvatar}>{initials(person)}<i /></div>
                  <div className={styles.requestCopy}><strong>{person.display_name || person.email}</strong><span>يريد إضافتك كصديق</span></div>
                  <div className={styles.requestActions}>
                    <button type="button" className={styles.acceptButton} onClick={() => respondFriendRequest(request.id, true)}>✓</button>
                    <button type="button" className={styles.rejectButton} onClick={() => respondFriendRequest(request.id, false)}>×</button>
                  </div>
                </div>
              }) : <p className={styles.empty}>Aucune demande d&apos;ami</p>
            ) : visiblePeople.map((person) => {
              const isFriend = friendIds.has(person.id)
              const hasConversation = Boolean(conversationMeta[person.id])
              const outgoing = outgoingByReceiver.get(person.id)
              const incoming = incomingBySender.get(person.id)
              return <div className={`${styles.contactRow} ${activePerson?.id === person.id ? styles.contactActive : ''}`} key={person.id}>
                <button type="button" className={styles.personMain} onClick={() => openConversation(person)} disabled={!isFriend && !hasConversation}>
                  <div className={styles.contactAvatar}>{initials(person)}<i /></div>
                  <div className={styles.contactCopy}><div><strong>{person.display_name || 'Utilisateur WakhReek'}</strong><time>{formatTime(conversationMeta[person.id]?.latest?.created_at)}</time></div><p>{incoming ? 'Invitation reçue' : outgoing ? 'Invitation envoyée' : latestLabel(person)}</p></div>
                </button>
                {search.trim() && !isFriend && !hasConversation && !outgoing && !incoming && <button type="button" className={styles.friendAction} onClick={() => sendFriendRequest(person)} title="Ajouter comme ami">＋ Ami</button>}
                {search.trim() && outgoing && <span className={styles.pendingBadge}>En attente</span>}
                {search.trim() && incoming && <button type="button" className={styles.friendAction} onClick={() => setFilter('demandes')}>Voir demande</button>}
              </div>
            })}
            {filter !== 'demandes' && !visiblePeople.length && <p className={styles.empty}>{search.trim() ? 'Aucun utilisateur trouvé' : filter === 'amis' ? 'Aucun ami pour le moment' : 'Aucune conversation'}</p>}
          </div>
          <div className={styles.encryption}>🔒 Vos messages personnels sont <strong>protégés</strong></div>
        </aside>

        <main className={styles.chat}>
          <header className={styles.chatHeader}>
            <button type="button" className={styles.mobileBack} onClick={() => { setActivePerson(null); setConversationId(null); setMessages([]) }} aria-label="Retour">←</button>
            <div className={styles.chatIdentity}><div className={styles.avatarMedium}>{initials(activePerson)}</div><div><strong>{activePerson?.display_name || 'WakhReek Communication'}</strong><span>{activePerson ? 'En ligne' : 'Choisissez un contact'}</span></div></div>
            <div className={styles.chatActions}><button type="button" title="Rechercher">⌕</button><button type="button" title="Appel vocal" disabled>☎</button><button type="button" title="Appel vidéo" disabled>▣</button><button type="button" title="Plus">⋮</button></div>
          </header>
          <section className={styles.messages}>
            {!activePerson && <div className={styles.welcome}>Choisissez une discussion pour commencer.</div>}
            {messages.map((message) => { const mine = message.sender_id === me?.id; return <div className={`${styles.messageRow} ${mine ? styles.mine : ''}`} key={message.id}><div className={`${styles.bubble} ${mine ? styles.bubbleMine : ''}`}>{message.message_type === 'audio' && message.media_url ? <audio controls src={message.media_url} className={styles.audio} /> : <p>{message.body}</p>}<time>{formatTime(message.created_at)} {mine ? '✓✓' : ''}</time></div></div> })}
            {status && <div className={styles.status}>{status}</div>}<div ref={messagesEndRef} />
          </section>
          <form className={styles.composer} onSubmit={sendMessage}>
            <button type="button" disabled>☺</button>
            <button type="button" disabled>⌕</button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={recording ? 'Enregistrement en cours…' : uploadingAudio ? 'Envoi du message vocal…' : activePerson ? 'Message' : 'Choisissez une conversation'} disabled={!activePerson || recording || uploadingAudio} />
            <button type="button" disabled>📎</button>
            <button type="button" disabled>📷</button>
            {text.trim() ? <button type="submit" className={styles.send} disabled={!activePerson || uploadingAudio}>➤</button> : <button type="button" className={`${styles.send} ${recording ? styles.recording : ''}`} onClick={recording ? stopVoiceRecording : startVoiceRecording} disabled={!activePerson || uploadingAudio} aria-label={recording ? 'Arrêter et envoyer' : 'Enregistrer un message vocal'}>{recording ? '■' : '🎙'}</button>}
          </form>
        </main>
      </div>
    </div>
  )
}
