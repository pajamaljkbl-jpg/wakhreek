'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ displayName: '', phone: '', email: '', password: '' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/communication')
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) router.replace('/communication')
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

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
        emailRedirectTo: `${window.location.origin}/communication`,
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
    router.replace('/communication')
  }

  if (loading) return <main className="landing-shell"><section className="landing-card"><p>Chargement...</p></section></main>

  return (
    <main className="landing-shell">
      <header className="landing-topbar">
        <div className="landing-brand"><span className="app-logo">wR</span><strong>WakhReek -Onley Took</strong></div>
        <span>Français</span>
      </header>

      <section className="landing-card">
        <div className="landing-logo"><span className="landing-logo-mark">wR</span><strong>WAKHREEK</strong></div>
        <h1>ONLY TOK</h1>
        <h2>WAKH REEK</h2>
        <p>Inscrivez-vous et communiquez librement.</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage('') }}>Connexion</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage('') }}>Inscription</button>
        </div>

        <form className="auth-form" onSubmit={mode === 'signup' ? signUp : signIn}>
          {mode === 'signup' && <input name="displayName" value={form.displayName} onChange={change} placeholder="Nom complet" required />}
          {mode === 'signup' && <input name="phone" value={form.phone} onChange={change} placeholder="Téléphone" required />}
          <input name="email" type="email" value={form.email} onChange={change} placeholder="E-mail" autoComplete="email" required />
          <input name="password" type="password" value={form.password} onChange={change} placeholder="Mot de passe" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
          <button className="primary" type="submit">{mode === 'signup' ? "S'inscrire" : 'Se connecter'}</button>
        </form>
        {message && <p className="message">{message}</p>}
      </section>
    </main>
  )
}
