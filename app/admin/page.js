'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [boutiques, setBoutiques] = useState([])
  const [subscriptions, setSubscriptions] = useState([])

  async function loadAdminData() {
    setLoading(true)
    setError('')

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

  return (
    <main style={{ minHeight: '100vh', background: '#f4f7fb', padding: 24, fontFamily: 'Arial, sans-serif', color: '#172033' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30 }}>WakhReek Admin</h1>
            <p style={{ margin: '6px 0 0', color: '#667085' }}>Gestion des boutiques et abonnements</p>
          </div>
          <button onClick={loadAdminData} style={buttonStyle('#0066ff')}>Actualiser</button>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
          <Stat label="Boutiques" value={boutiques.length} />
          <Stat label="Boutiques actives" value={liveCount} />
          <Stat label="Paiements en attente" value={pendingCount} />
        </section>

        {loading && <div style={cardStyle}>Chargement...</div>}
        {error && <div style={{ ...cardStyle, border: '1px solid #f04438', color: '#b42318' }}>Erreur: {error}</div>}

        {!loading && !error && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Boutiques</h2>
            {boutiques.length === 0 ? (
              <p style={{ color: '#667085' }}>Aucune boutique pour le moment.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr>
                      {['Boutique', 'Plan', 'Paiement', 'Montant', 'État boutique', 'Créée le'].map((title) => (
                        <th key={title} style={thStyle}>{title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {boutiques.map((boutique) => {
                      const subscription = subscriptionsByBoutique.get(boutique.id)
                      return (
                        <tr key={boutique.id}>
                          <td style={tdStyle}><strong>{boutique.name}</strong></td>
                          <td style={tdStyle}>{boutique.plan || '-'}</td>
                          <td style={tdStyle}>{subscription?.status || 'Aucun paiement'}</td>
                          <td style={tdStyle}>{subscription?.amount_cfa != null ? `${subscription.amount_cfa} CFA` : '-'}</td>
                          <td style={tdStyle}>{boutique.is_live ? 'Active' : 'Inactive'}</td>
                          <td style={tdStyle}>{boutique.created_at ? new Date(boutique.created_at).toLocaleDateString('fr-FR') : '-'}</td>
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
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 13, color: '#667085', marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 4px 18px rgba(16,24,40,.06)',
}

const thStyle = {
  textAlign: 'left',
  padding: '12px 10px',
  borderBottom: '1px solid #eaecf0',
  color: '#667085',
  fontSize: 13,
}

const tdStyle = {
  padding: '14px 10px',
  borderBottom: '1px solid #f2f4f7',
  fontSize: 14,
}

function buttonStyle(background) {
  return {
    border: 0,
    borderRadius: 10,
    padding: '10px 16px',
    background,
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  }
}
