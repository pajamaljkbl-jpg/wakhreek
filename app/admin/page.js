'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [boutiques, setBoutiques] = useState([])
  const [subscriptions, setSubscriptions] = useState([])

  async function verifyAdmin() {
    const { data, error: authError } = await supabase.auth.getUser()
    const admin = !authError && data?.user?.app_metadata?.role === 'admin'
    setIsAdmin(admin)
    setAuthChecked(true)
    return admin
  }

  async function loadAdminData() {
    setLoading(true)
    setError('')

    const admin = await verifyAdmin()
    if (!admin) {
      setLoading(false)
      return
    }

    const [boutiquesResult, subscriptionsResult] = await Promise.all([
      supabase.from('boutiques').select('id,name,plan,is_live,created_at').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('id,boutique_id,plan,amount_cfa,status,created_at').order('created_at', { ascending: false }),
    ])

    if (boutiquesResult.error || subscriptionsResult.error) {
      setError(boutiquesResult.error?.message || subscriptionsResult.error?.message || 'Erreur de chargement')
    } else {
      setBoutiques(boutiquesResult.data || [])
      setSubscriptions(subscriptionsResult.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const subscriptionsByBoutique = useMemo(() => {
    const map = new Map()
    for (const subscription of subscriptions) {
      if (!map.has(subscription.boutique_id)) map.set(subscription.boutique_id, subscription)
    }
    return map
  }, [subscriptions])

  const pendingCount = subscriptions.filter((item) => item.status === 'pending').length
  const liveCount = boutiques.filter((item) => item.is_live).length

  async function setBoutiqueLive(boutiqueId, isLive, successMessage) {
    setActionBusy(`boutique-${boutiqueId}`)
    setError('')
    setNotice('')
    const { error: updateError } = await supabase.from('boutiques').update({ is_live: isLive }).eq('id', boutiqueId)
    if (updateError) {
      setError(updateError.message)
    } else {
      setNotice(successMessage)
      await loadAdminData()
    }
    setActionBusy('')
  }

  async function approveSubscription(subscription, boutiqueId) {
    setActionBusy(`subscription-${subscription.id}`)
    setError('')
    setNotice('')

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({ status: 'approved' })
      .eq('id', subscription.id)

    if (subscriptionError) {
      setError(subscriptionError.message)
      setActionBusy('')
      return
    }

    const { error: boutiqueError } = await supabase
      .from('boutiques')
      .update({ is_live: true })
      .eq('id', boutiqueId)

    if (boutiqueError) {
      setError(boutiqueError.message)
    } else {
      setNotice('Paiement approuvé et boutique activée.')
      await loadAdminData()
    }
    setActionBusy('')
  }

  async function rejectSubscription(subscription, boutiqueId) {
    setActionBusy(`subscription-${subscription.id}`)
    setError('')
    setNotice('')

    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({ status: 'rejected' })
      .eq('id', subscription.id)

    if (subscriptionError) {
      setError(subscriptionError.message)
      setActionBusy('')
      return
    }

    const { error: boutiqueError } = await supabase
      .from('boutiques')
      .update({ is_live: false })
      .eq('id', boutiqueId)

    if (boutiqueError) {
      setError(boutiqueError.message)
    } else {
      setNotice('Paiement refusé et boutique désactivée.')
      await loadAdminData()
    }
    setActionBusy('')
  }

  if (!authChecked || loading) {
    return <main style={pageStyle}><div style={cardStyle}>Vérification Admin...</div></main>
  }

  if (!isAdmin) {
    return (
      <main style={pageStyle}>
        <div style={{ ...cardStyle, maxWidth: 560, margin: '80px auto', textAlign: 'center' }}>
          <h1 style={{ marginTop: 0 }}>Accès Admin protégé</h1>
          <p style={{ color: '#667085' }}>Cette page est réservée au compte administrateur WakhReek.</p>
          <a href="/" style={{ color: '#0066ff', fontWeight: 700 }}>Retour à WakhReek</a>
        </div>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30 }}>WakhReek Admin</h1>
            <p style={{ margin: '6px 0 0', color: '#667085' }}>Gestion protégée des boutiques et abonnements</p>
          </div>
          <button onClick={loadAdminData} style={buttonStyle('#0066ff')}>Actualiser</button>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
          <Stat label="Boutiques" value={boutiques.length} />
          <Stat label="Boutiques actives" value={liveCount} />
          <Stat label="Paiements en attente" value={pendingCount} />
        </section>

        {notice && <div style={{ ...cardStyle, border: '1px solid #12b76a', color: '#027a48', marginBottom: 18 }}>{notice}</div>}
        {error && <div style={{ ...cardStyle, border: '1px solid #f04438', color: '#b42318', marginBottom: 18 }}>Erreur: {error}</div>}

        {!error && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Boutiques</h2>
            {boutiques.length === 0 ? (
              <p style={{ color: '#667085' }}>Aucune boutique pour le moment.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                  <thead><tr>{['Boutique', 'Plan', 'Paiement', 'Montant', 'État', 'Créée le', 'Actions Admin'].map((title) => <th key={title} style={thStyle}>{title}</th>)}</tr></thead>
                  <tbody>
                    {boutiques.map((boutique) => {
                      const subscription = subscriptionsByBoutique.get(boutique.id)
                      const busyBoutique = actionBusy === `boutique-${boutique.id}`
                      const busySubscription = subscription && actionBusy === `subscription-${subscription.id}`
                      const busy = busyBoutique || busySubscription

                      return (
                        <tr key={boutique.id}>
                          <td style={tdStyle}><strong>{boutique.name}</strong></td>
                          <td style={tdStyle}>{boutique.plan || '-'}</td>
                          <td style={tdStyle}>{subscription?.status || 'Aucun paiement'}</td>
                          <td style={tdStyle}>{subscription?.amount_cfa != null ? `${subscription.amount_cfa} CFA` : '-'}</td>
                          <td style={tdStyle}>{boutique.is_live ? 'Active' : 'Inactive'}</td>
                          <td style={tdStyle}>{boutique.created_at ? new Date(boutique.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                          <td style={{ ...tdStyle, minWidth: 290 }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {!boutique.is_live && (
                                <button disabled={busy} onClick={() => setBoutiqueLive(boutique.id, true, 'Boutique activée gratuitement par Admin.')} style={buttonStyle('#7f56d9')}>
                                  {busyBoutique ? '...' : 'Activer gratuit'}
                                </button>
                              )}
                              {boutique.is_live && (
                                <button disabled={busy} onClick={() => setBoutiqueLive(boutique.id, false, 'Boutique désactivée par Admin.')} style={buttonStyle('#667085')}>
                                  {busyBoutique ? '...' : 'Désactiver'}
                                </button>
                              )}
                              {subscription?.status === 'pending' && (
                                <>
                                  <button disabled={busy} onClick={() => approveSubscription(subscription, boutique.id)} style={buttonStyle('#12b76a')}>
                                    {busySubscription ? '...' : 'Approuver'}
                                  </button>
                                  <button disabled={busy} onClick={() => rejectSubscription(subscription, boutique.id)} style={buttonStyle('#d92d20')}>
                                    {busySubscription ? '...' : 'Refuser'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

function Stat({ label, value }) {
  return <div style={cardStyle}><div style={{ fontSize: 13, color: '#667085', marginBottom: 7 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div></div>
}

const pageStyle = { minHeight: '100vh', background: '#f4f7fb', padding: 24, fontFamily: 'Arial, sans-serif', color: '#172033' }
const cardStyle = { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 4px 18px rgba(16,24,40,.06)' }
const thStyle = { textAlign: 'left', padding: '12px 10px', borderBottom: '1px solid #eaecf0', color: '#667085', fontSize: 13 }
const tdStyle = { padding: '14px 10px', borderBottom: '1px solid #f2f4f7', fontSize: 14 }
function buttonStyle(background) { return { border: 0, borderRadius: 10, padding: '9px 12px', background, color: '#fff', fontWeight: 700, cursor: 'pointer' } }
