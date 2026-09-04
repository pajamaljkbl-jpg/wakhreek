'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState('signup')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ displayName: '', phone: '', email: '', password: '' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/communication')
      else setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/communication')
    })
    return () => listener.subscription.unsubscribe()
  }, [router])

  function change(e) { setForm((old) => ({ ...old, [e.target.name]: e.target.value })) }

  async function signUp(e) {
    e.preventDefault()
    setMessage('Création du compte...')
    const { error } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password, options: { emailRedirectTo: `${window.location.origin}/communication`, data: { display_name: form.displayName.trim(), phone: form.phone.trim() } } })
    setMessage(error ? error.message : 'Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.')
  }

  async function signIn(e) {
    e.preventDefault()
    setMessage('Connexion...')
    const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
    if (error) return setMessage(error.message)
    router.replace('/communication')
  }

  if (loading) return <main className="wr-landing"><section className="wr-auth-card wr-loading">Chargement...</section></main>

  return (
    <main className="wr-landing">
      <header className="wr-topbar">
        <div className="wr-top-brand"><span className="wr-mini-logo">WR</span><strong>WakhReek <span>- Onley Took</span></strong></div>
        <div className="wr-top-actions"><span>◉&nbsp; FR⌄</span><i></i><span>👤&nbsp; Aide</span></div>
      </header>

      <section className="wr-auth-card">
        <img className="wr-official-logo" src="/wakhreek-logo.png" alt="WakhReek - Boutiques, Messagerie, Communauté" />
        <p className="wr-subtitle">Inscris-toi pour accéder aux boutiques et à la messagerie.</p>
        <div className="wr-mode-tabs" role="tablist" aria-label="Inscription ou connexion">
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage('') }}>Inscription</button>
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage('') }}>Connexion</button>
        </div>
        <form className="wr-auth-form" onSubmit={mode === 'signup' ? signUp : signIn}>
          {mode === 'signup' && <label className="wr-field"><span>👤</span><input name="displayName" value={form.displayName} onChange={change} placeholder="Nom complet" required /></label>}
          {mode === 'signup' && <label className="wr-field"><span>☎</span><input name="phone" value={form.phone} onChange={change} placeholder="Téléphone" required /><em>🇸🇳⌄</em></label>}
          <label className="wr-field"><span>✉</span><input name="email" type="email" value={form.email} onChange={change} placeholder="E-mail" autoComplete="email" required /></label>
          <label className="wr-field"><span>🔒</span><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={change} placeholder="Mot de passe" minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required /><button type="button" className="wr-eye" onClick={() => setShowPassword((v) => !v)} aria-label="Afficher ou masquer le mot de passe">◉</button></label>
          <button className="wr-primary" type="submit">{mode === 'signup' ? "S’inscrire / Créer mon compte" : 'Se connecter'}</button>
        </form>
        {message && <p className="wr-message">{message}</p>}
        <p className="wr-foot">En continuant, tu acceptes nos <a href="#">Conditions d’utilisation</a><br />et notre <a href="#">Politique de confidentialité.</a></p>
      </section>
    </main>
  )
}
