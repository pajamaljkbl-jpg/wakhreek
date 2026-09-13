'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useI18n } from '../components/I18nProvider'
import { authTranslate } from '../lib/i18n-auth'

export default function Home() {
  const router = useRouter()
  const { language, t } = useI18n()
  const tr = (key, fallback) => authTranslate(language, key, fallback)
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

  function change(e) {
    setForm((old) => ({ ...old, [e.target.name]: e.target.value }))
  }

  async function signUp(e) {
    e.preventDefault()
    const displayName = form.displayName.trim()
    const phone = form.phone.trim()
    const email = form.email.trim().toLowerCase()

    if (!displayName || !phone || !email) return setMessage(tr('fillAll', 'Veuillez remplir tous les champs.'))
    setMessage(tr('checking', 'Vérification des informations...'))

    const { data: identity, error: identityError } = await supabase
      .rpc('check_registration_identity', { check_phone: phone, check_display_name: displayName })

    if (identityError) return setMessage(tr('checkFailed', 'Impossible de vérifier les informations. Réessayez.'))
    if (identity?.[0]?.phone_taken) return setMessage(tr('phoneTaken', 'Ce numéro de téléphone est déjà utilisé par un autre compte.'))

    setMessage(tr('creating', 'Création du compte...'))
    const { error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/communication`,
        data: { display_name: displayName, phone },
      },
    })

    setMessage(error ? error.message : tr('created', 'Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.'))
  }

  async function signIn(e) {
    e.preventDefault()
    setMessage(tr('connecting', 'Connexion...'))

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })

    if (error) return setMessage(error.message)
    router.replace('/communication')
  }

  if (loading) {
    return <main className="wr-landing"><section className="wr-auth-card wr-loading">{t('loading', 'Chargement...')}</section></main>
  }

  return (
    <main className="wr-landing">
      <header className="wr-topbar">
        <div className="wr-top-brand">
          <span className="wr-mini-logo">WR</span>
          <strong>WakhReek <span>- Onley Took</span></strong>
        </div>
        <div className="wr-top-actions"><span>◎</span><i></i><span>👤&nbsp; {tr('help', 'Aide')}</span></div>
      </header>

      <section className="wr-auth-card">
        <img className="wr-official-logo" src="/wakhreek-logo.svg?v=3" alt="WakhReek" />
        <p className="wr-subtitle">{tr('subtitle', 'Inscris-toi pour accéder aux boutiques et à la messagerie.')}</p>

        <div className="wr-mode-tabs" role="tablist" aria-label={tr('tabsLabel', 'Inscription ou connexion')}>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage('') }}>{tr('signupTab', 'Inscription')}</button>
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage('') }}>{tr('loginTab', 'Connexion')}</button>
        </div>

        <form className="wr-auth-form" onSubmit={mode === 'signup' ? signUp : signIn}>
          {mode === 'signup' && <label className="wr-field"><span>👤</span><input name="displayName" value={form.displayName} onChange={change} placeholder={tr('fullName', 'Nom complet')} required /></label>}
          {mode === 'signup' && <label className="wr-field"><span>☎</span><input name="phone" value={form.phone} onChange={change} placeholder={tr('phone', 'Téléphone')} required /><em>🇸🇳⌄</em></label>}
          <label className="wr-field"><span>✉</span><input name="email" type="email" value={form.email} onChange={change} placeholder={tr('email', 'E-mail')} autoComplete="email" required /></label>
          <label className="wr-field"><span>🔒</span><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={change} placeholder={tr('password', 'Mot de passe')} minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required /><button type="button" className="wr-eye" onClick={() => setShowPassword((v) => !v)} aria-label={tr('togglePassword', 'Afficher ou masquer le mot de passe')}>◉</button></label>
          <button className="wr-primary" type="submit">{mode === 'signup' ? tr('signupButton', 'S’inscrire / Créer mon compte') : tr('loginButton', 'Se connecter')}</button>
        </form>

        {message && <p className="wr-message">{message}</p>}

        <p className="wr-foot">{tr('acceptPrefix', 'En continuant, tu acceptes nos')} <a href="#">{tr('terms', 'Conditions d’utilisation')}</a><br />{tr('andPrivacy', 'et notre')} <a href="#">{tr('privacy', 'Politique de confidentialité.')}</a></p>

        <div className="wr-switch-line">
          <span>{mode === 'signup' ? tr('alreadyAccount', 'Tu as déjà un compte ?') : tr('noAccount', 'Tu n’as pas encore de compte ?')}</span>
          <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage('') }}>{mode === 'signup' ? tr('loginButton', 'Se connecter') : tr('createAccount', 'Créer un compte')}</button>
        </div>

        <div className="wr-benefits">
          <div><b>👜</b><span><strong>{tr('shops', 'Boutiques')}</strong><small>{tr('buySell', 'Achète et vends')}</small></span></div>
          <div><b>💬</b><span><strong>{tr('messaging', 'Messagerie')}</strong><small>{tr('safeExchange', 'Échange en sécurité')}</small></span></div>
          <div><b>👥</b><span><strong>{tr('community', 'Communauté')}</strong><small>{tr('stayConnected', 'Reste connecté')}</small></span></div>
        </div>
      </section>
    </main>
  )
}
