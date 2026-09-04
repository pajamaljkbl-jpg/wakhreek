'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState('signup')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
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
    e.preventDefault(); setMessage('Création du compte...')
    const { error } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password, options: { emailRedirectTo: `${window.location.origin}/communication`, data: { display_name: form.displayName.trim(), phone: form.phone.trim() } } })
    setMessage(error ? error.message : 'Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.')
  }

  async function signIn(e) {
    e.preventDefault(); setMessage('Connexion...')
    const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
    if (error) return setMessage(error.message)
    router.replace('/communication')
  }

  if (loading) return <main className="wr-landing"><section className="wr-card">Chargement...</section></main>

  return <main className="wr-landing">
    <header className="wr-bar"><div className="wr-brand"><span className="wr-bubble">wR</span><strong>WakhReek -Onley Took</strong></div><span>Français</span></header>
    <section className="wr-card">
      <div className="wr-logo"><div className="wr-logo-bubble">WR</div><strong>WAKHREEK</strong></div>
      <h1>ONLY TOK</h1><h2>WAKH REEK</h2>
      <p className="wr-intro">Inscris-toi pour accéder aux boutiques et à la messagerie.</p>
      <div className="wr-tabs"><button type="button" className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setMessage('')}}>Inscription</button><button type="button" className={mode==='login'?'active':''} onClick={()=>{setMode('login');setMessage('')}}>Connexion</button></div>
      <form className="wr-form" onSubmit={mode==='signup'?signUp:signIn}>
        {mode==='signup' && <><input name="displayName" value={form.displayName} onChange={change} placeholder="Nom complet" required/><input name="phone" value={form.phone} onChange={change} placeholder="Téléphone" required/></>}
        <input name="email" type="email" value={form.email} onChange={change} placeholder="E-mail" autoComplete="email" required/>
        <input name="password" type="password" value={form.password} onChange={change} placeholder="Mot de passe" minLength={6} autoComplete={mode==='signup'?'new-password':'current-password'} required/>
        <button className="wr-submit" type="submit">{mode==='signup'?"S'inscrire / Créer mon compte":'Se connecter'}</button>
      </form>
      {message && <p className="wr-message">{message}</p>}
      <p className="wr-foot">En continuant, tu acceptes nos Conditions d'utilisation et notre Politique de confidentialité.</p>
    </section>
  </main>
}
