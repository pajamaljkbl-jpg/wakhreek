'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Compte() {
  const router = useRouter()
  const [mode, setMode] = useState('choice')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { phone } },
    })

    setLoading(false)
    if (signupError) {
      setError(signupError.message)
    } else {
      router.push('/')
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)
    if (loginError) {
      setError(loginError.message)
    } else {
      router.push('/')
    }
  }

  return (
    <main className="wr-landing">
      <header className="wr-topbar">
        <div className="wr-top-brand">
          <span className="wr-mini-logo">WR</span>
          <strong>WakhReek <span>- Onley Took</span></strong>
        </div>
        <div className="wr-top-actions">
          <span>◎&nbsp; FR</span>
          <i></i>
          <span>👤&nbsp; Aide</span>
        </div>
      </header>

      <section className="wr-auth-card">
        <img className="wr-official-logo" src="/wakhreek-logo.svg" alt="WakhReek" />

        <h1 style={{ margin: '0 0 2px', fontSize: '30px', color: '#182536' }}>ONLY TOK</h1>
        <h2 style={{ margin: '0 0 18px', fontSize: '38px', color: '#087af0' }}>WAKH REEK</h2>

        {mode === 'choice' && (
          <>
            <p className="wr-subtitle">Inscris-toi pour accéder aux boutiques et à la messagerie.</p>
            <button
              type="button"
              className="wr-switch-line"
              onClick={() => setMode('signup')}
              style={{ border: 0, background: 'transparent', marginTop: 0, paddingTop: 0, color: '#0877e8', fontWeight: 800, textDecoration: 'underline' }}
            >
              Créer un compte sécurisé ou se connecter
            </button>
            <p className="wr-foot" style={{ marginBottom: '18px' }}>
              Inscription avec e-mail et téléphone obligatoire. Une fois connecté, ton compte reste ouvert sur cet appareil.
            </p>
            <button type="button" className="wr-primary" onClick={() => setMode('signup')}>
              S&apos;inscrire / Se connecter
            </button>
          </>
        )}

        {(mode === 'signup' || mode === 'login') && (
          <>
            <div className="wr-mode-tabs" role="tablist" aria-label="Inscription ou connexion">
              <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError('') }}>Inscription</button>
              <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Connexion</button>
            </div>

            <form className="wr-auth-form" onSubmit={mode === 'signup' ? handleSignup : handleLogin}>
              <label className="wr-field">
                <span>✉</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" autoComplete="email" />
              </label>

              {mode === 'signup' && (
                <label className="wr-field">
                  <span>☎</span>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" autoComplete="tel" />
                </label>
              )}

              <label className="wr-field">
                <span>🔒</span>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
              </label>

              {error && <p className="wr-message" style={{ color: '#c62828' }}>{error}</p>}

              <button type="submit" className="wr-primary" disabled={loading}>
                {loading ? 'Chargement...' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
              </button>
            </form>

            <div className="wr-switch-line">
              <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }}>
                {mode === 'signup' ? "J'ai déjà un compte — Se connecter" : "Je n'ai pas de compte — S'inscrire"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
