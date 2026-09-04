'use client'

import { useCallback, useEffect, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabase'

export default function CommunicationPage() {
  const [me, setMe] = useState(null)
  const [people, setPeople] = useState([])
  const [search, setSearch] = useState('')
  const [conversationId, setConversationId] = useState(null)
  const [activePerson, setActivePerson] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')

  const loadPeople = useCallback(async (value = '') => {
    const { data, error } = await supabase.rpc('find_people', { search_text: value })
    if (error) return setStatus(error.message)
    setPeople(data || [])
  }, [])

  const loadMessages = useCallback(async (id) => {
    if (!id) return
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at')
    if (error) return setStatus(error.message)
    setMessages(data || [])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMe(data.user || null)
      if (data.user) loadPeople()
    })
  }, [loadPeople])

  useEffect(() => {
    if (!conversationId) return
    loadMessages(conversationId)
    const channel = supabase.channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages((current) => current.some((item) => item.id === payload.new.id) ? current : [...current, payload.new])
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, loadMessages])

  async function searchPeople(e) {
    e.preventDefault()
    await loadPeople(search.trim())
  }

  async function openConversation(person) {
    setStatus('Ouverture de la conversation...')
    const { data, error } = await supabase.rpc('start_direct_conversation', { other_user: person.id })
    if (error) return setStatus(error.message)
    setActivePerson(person)
    setConversationId(data)
    setStatus('')
  }

  function closeConversation() {
    setActivePerson(null)
    setConversationId(null)
    setMessages([])
    setStatus('')
  }

  async function sendMessage(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !conversationId || !me) return
    setText('')
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: me.id, body, message_type: 'text' })
    if (error) { setText(body); setStatus(error.message) }
  }

  function notReady(feature) {
    setStatus(`${feature} : activation à la prochaine étape.`)
  }

  const initial = (person) => (person?.display_name || person?.email || 'WR').slice(0, 2).toUpperCase()

  return (
    <AppShell>
      <div className={`communication-layout wr-chat-reference ${activePerson ? 'mobile-chat-open' : ''}`}>
        <aside className="chat-sidebar">
          <form className="chat-search" onSubmit={searchPeople}>
            <span className="search-icon">⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher ou démarrer une discussion" />
          </form>
          <div className="chat-filters">
            <button className="active" type="button">Toutes</button><button type="button">Non lues</button><button type="button">Favoris</button><button type="button">Groupes</button>
          </div>
          <div className="chat-list">
            {people.map((person) => (
              <button className={`chat-row ${activePerson?.id === person.id ? 'active' : ''}`} key={person.id} onClick={() => openConversation(person)}>
                <span className="chat-avatar">{initial(person)}</span>
                <span className="chat-summary"><strong>{person.display_name || 'Utilisateur WakhReek'}</strong><small>{person.email || 'Compte WakhReek'}</small></span>
                <span className="chat-presence">●</span>
              </button>
            ))}
            {!people.length && <p className="empty-list">Aucun autre utilisateur trouvé.</p>}
          </div>
          <div className="chat-encryption">🔒 Vos messages personnels restent privés sur WakhReek</div>
        </aside>

        <section className="chat-main">
          <header className="chat-header">
            <button className="mobile-back" type="button" aria-label="Retour" onClick={closeConversation}>‹</button>
            <div className="chat-contact"><span className="chat-avatar large">{initial(activePerson)}</span><span><strong>{activePerson?.display_name || 'WakhReek Communication'}</strong><small>{activePerson ? '● En ligne' : 'Choisissez un contact'}</small></span></div>
            <div className="chat-actions"><button type="button" aria-label="Rechercher">⌕</button><button type="button" aria-label="Appel audio" onClick={() => notReady('Appel audio')}>☎</button><button type="button" aria-label="Appel vidéo" onClick={() => notReady('Appel vidéo')}>▣</button><button type="button" aria-label="Menu">⋮</button></div>
          </header>

          <div className="chat-body">
            {!activePerson && <div className="chat-welcome"><div className="welcome-logo">WR</div><h2>WakhReek Communication</h2><p>Choisissez un contact pour commencer une discussion.</p></div>}
            {messages.map((message) => (
              <div className={`bubble ${message.sender_id === me?.id ? 'sent' : 'received'}`} key={message.id}>
                <span>{message.body}</span><small>{message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}{message.sender_id === me?.id ? '  ✓✓' : ''}</small>
              </div>
            ))}
            {status && <button className="system-note" type="button" onClick={() => setStatus('')}>{status} ×</button>}
          </div>

          <form className="composer" onSubmit={sendMessage}>
            <button type="button" aria-label="Emoji" onClick={() => setText((v) => `${v}☺`)}>☺</button>
            <button type="button" aria-label="Joindre" onClick={() => notReady('Pièces jointes')}>＋</button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={activePerson ? 'Message' : 'Choisissez un contact'} disabled={!activePerson} />
            <button type="button" aria-label="Caméra" onClick={() => notReady('Caméra')}>▣</button>
            {text.trim() ? <button className="send-button" type="submit" aria-label="Envoyer" disabled={!activePerson}>➤</button> : <button className="voice-button" type="button" aria-label="Message vocal" onClick={() => notReady('Message vocal')} disabled={!activePerson}>🎙</button>}
          </form>
        </section>
      </div>
    </AppShell>
  )
}
