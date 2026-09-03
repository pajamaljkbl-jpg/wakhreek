'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [mode, setMode] = useState('login')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ displayName: '', phone: '', email: '', password: '' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  function change(e) {
    setForm((old) => ({ ...old, [e.target.name]: e.target.value }))
  }

  async function signUp(e) {
    e.preventDefault()
    setMessage('Création du compte...')
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: form.displayName.trim(), phone: form.phone.trim() },
      },
    })
    if (error) return setMessage(error.message)
    setMessage('Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.')
  }

  async function signIn(e) {
    e.preventDefault()
    setMessage('Connexion...')
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })
    if (error) return setMessage(error.message)
    setMessage('')
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) setMessage(error.message)
  }

  if (loading) return <main className="shell"><section className="card"><p>Chargement...</p></section></main>

  if (session) {
    const name = session.user.user_metadata?.display_name || session.user.email
    return (
      <main className="shell">
        <section className="card dashboard">
          <div className="brand"><span className="logo">wR</span><div><h1>WakhReek</h1><p>Onley Took</p></div></div>
          <div className="ok">✓</div>
          <h2>Bienvenue</h2>
          <p className="welcome">{name}</p>
          <p>Votre session WakhReek est active.</p>
          <button className="danger" onClick={signOut}>Déconnexion</button>
        </section>
      </main>
    )
  }

  return (
    <main className="shell">
      <section className="card">
        <div className="brand"><span className="logo">wR</span><div><h1>WakhReek</h1><p>Onley Took</p></div></div>
        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage('') }}>Connexion</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage('') }}>Inscription</button>
        </div>
        <form onSubmit={mode === 'signup' ? signUp : signIn}>
          {mode === 'signup' && <input name="displayName" value={form.displayName} onChange={change} placeholder="Nom complet" required />}
          {mode === 'signup' && <input name="phone" value={form.phone} onChange={change} placeholder="Téléphone" />}
          <input name="email" type="email" value={form.email} onChange={change} placeholder="E-mail" autoComplete="email" required />
          <input name="password" type="password" value={form.password} onChange={change} placeholder="Mot de passe" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
          <button className="primary" type="submit">{mode === 'signup' ? "S'inscrire" : 'Se connecter'}</button>
        </form>
        {message && <p className="message">{message}</p>}
      </section>
    </main>
  )
}
