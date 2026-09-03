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
      })
      .subscribe()
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

  async function sendMessage(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body || !conversationId || !me) return
    setText('')
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: me.id, body, message_type: 'text' })
    if (error) {
      setText(body)
      setStatus(error.message)
    }
  }

  return (
    <AppShell title="Communication">
      <div className="communication-layout">
        <aside className="chat-sidebar">
          <form className="chat-search" onSubmit={searchPeople}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur" />
          </form>
          <div className="chat-filters"><button className="active" type="button">Contacts</button></div>
          <div className="chat-list">
            {people.map((person) => (
              <button className={`chat-row ${activePerson?.id === person.id ? 'active' : ''}`} key={person.id} onClick={() => openConversation(person)}>
                <span className="chat-avatar">{(person.display_name || person.email || 'WR').slice(0,2).toUpperCase()}</span>
                <span className="chat-summary"><strong>{person.display_name || 'Utilisateur WakhReek'}</strong><small>{person.email}</small></span>
              </button>
            ))}
            {!people.length && <p className="empty-list">Aucun autre utilisateur trouvé.</p>}
          </div>
        </aside>

        <section className="chat-main">
          <header className="chat-header">
            <div><strong>{activePerson?.display_name || 'WakhReek Communication'}</strong><small>{activePerson ? 'Conversation directe' : 'Choisissez un contact'}</small></div>
            <div className="chat-actions"><button type="button" aria-label="Appel audio" disabled>☎</button><button type="button" aria-label="Appel vidéo" disabled>▣</button></div>
          </header>
          <div className="chat-body">
            {!activePerson && <div className="system-note">Choisissez un utilisateur à gauche pour commencer une conversation.</div>}
            {messages.map((message) => (
              <div className={`bubble ${message.sender_id === me?.id ? 'sent' : 'received'}`} key={message.id}>
                {message.body}
              </div>
            ))}
            {status && <div className="system-note">{status}</div>}
          </div>
          <form className="composer" onSubmit={sendMessage}>
            <button type="button" aria-label="Emoji" disabled>☺</button>
            <button type="button" aria-label="Joindre" disabled>＋</button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={activePerson ? 'Écrire un message...' : 'Choisissez un contact'} disabled={!activePerson} />
            <button type="button" aria-label="Caméra" disabled>▣</button>
            <button type="submit" aria-label="Envoyer" disabled={!activePerson || !text.trim()}>➤</button>
          </form>
        </section>
      </div>
    </AppShell>
  )
}
