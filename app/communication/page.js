'use client'

import { useState } from 'react'
import AppShell from '../../components/AppShell'

const demoChats = [
  { name: 'Bienvenue WakhReek', text: 'Votre espace de communication est prêt.', time: 'Maintenant', unread: 1 },
]

export default function CommunicationPage() {
  const [text, setText] = useState('')

  return (
    <AppShell title="Communication">
      <div className="communication-layout">
        <aside className="chat-sidebar">
          <div className="chat-search"><input placeholder="Rechercher une conversation" /></div>
          <div className="chat-filters"><button className="active">Toutes</button><button>Non lues</button><button>Favoris</button></div>
          <div className="chat-list">
            {demoChats.map((chat) => (
              <button className="chat-row active" key={chat.name}>
                <span className="chat-avatar">WR</span>
                <span className="chat-summary"><strong>{chat.name}</strong><small>{chat.text}</small></span>
                <span className="chat-meta"><small>{chat.time}</small><b>{chat.unread}</b></span>
              </button>
            ))}
          </div>
        </aside>

        <section className="chat-main">
          <header className="chat-header">
            <div><strong>WakhReek Communication</strong><small>Connecté</small></div>
            <div className="chat-actions"><button aria-label="Appel audio">☎</button><button aria-label="Appel vidéo">▣</button><button aria-label="Plus">⋮</button></div>
          </header>
          <div className="chat-body">
            <div className="system-note">Communication est la première section en construction.</div>
            <div className="bubble received">Bienvenue dans WakhReek Communication.</div>
            <div className="bubble sent">Messages, audio, vidéo et appels seront construits ici.</div>
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); setText('') }}>
            <button type="button" aria-label="Emoji">☺</button>
            <button type="button" aria-label="Joindre">＋</button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message..." />
            <button type="button" aria-label="Caméra">▣</button>
            <button type="submit" aria-label="Envoyer">➤</button>
          </form>
        </section>
      </div>
    </AppShell>
  )
}
