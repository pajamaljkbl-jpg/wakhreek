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
    setIsAdmin(admin); setAuthChecked(true); return admin
  }

  async function loadAdminData() {
    setLoading(true); setError('')
    if (!(await verifyAdmin())) { setLoading(false); return }
    const [b, s] = await Promise.all([
      supabase.from('boutiques').select('id,name,plan,is_live,created_at').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('id,boutique_id,plan,country_code,amount_cfa,billing_amount,billing_currency,status,created_at,payment_method,payment_type,payment_reference,payment_selected_at,payment_submitted_at').order('created_at', { ascending: false }),
    ])
    if (b.error || s.error) setError(b.error?.message || s.error?.message || 'Erreur de chargement')
    else { setBoutiques(b.data || []); setSubscriptions(s.data || []) }
    setLoading(false)
  }

  useEffect(() => { loadAdminData() }, [])

  const subscriptionsByBoutique = useMemo(() => {
    const map = new Map(); for (const s of subscriptions) if (!map.has(s.boutique_id)) map.set(s.boutique_id, s); return map
  }, [subscriptions])
  const pendingCount = subscriptions.filter(s => s.status === 'pending').length
  const submittedCount = subscriptions.filter(s => s.status === 'pending' && s.payment_submitted_at).length
  const liveCount = boutiques.filter(b => b.is_live).length

  function paymentName(code) {
    if (code === 'wave') return 'Wave'
    if (code === 'orange_money') return 'Orange Money'
    if (code === 'free_money') return 'Free Money'
    return code || 'Non choisi'
  }
  function amountText(s) {
    if (!s) return '-'
    if (s.billing_currency === 'USD' && s.billing_amount != null) return `$${Number(s.billing_amount).toFixed(2)} USD`
    return `${Number(s.amount_cfa || 0).toLocaleString('fr-FR')} CFA`
  }

  async function setBoutiqueLive(id, live, msg) {
    setActionBusy(`boutique-${id}`); setError(''); setNotice('')
    const { error: e } = await supabase.from('boutiques').update({ is_live: live }).eq('id', id)
    if (e) setError(e.message); else { setNotice(msg); await loadAdminData() }
    setActionBusy('')
  }
  async function approveSubscription(s, boutiqueId) {
    setActionBusy(`subscription-${s.id}`); setError(''); setNotice('')
    const { error: se } = await supabase.from('subscriptions').update({ status: 'approved' }).eq('id', s.id)
    if (se) { setError(se.message); setActionBusy(''); return }
    const { error: be } = await supabase.from('boutiques').update({ is_live: true }).eq('id', boutiqueId)
    if (be) setError(be.message); else { setNotice('Paiement approuvé et boutique activée.'); await loadAdminData() }
    setActionBusy('')
  }
  async function rejectSubscription(s, boutiqueId) {
    setActionBusy(`subscription-${s.id}`); setError(''); setNotice('')
    const { error: se } = await supabase.from('subscriptions').update({ status: 'rejected' }).eq('id', s.id)
    if (se) { setError(se.message); setActionBusy(''); return }
    const { error: be } = await supabase.from('boutiques').update({ is_live: false }).eq('id', boutiqueId)
    if (be) setError(be.message); else { setNotice('Paiement refusé et boutique désactivée.'); await loadAdminData() }
    setActionBusy('')
  }

  if (!authChecked || loading) return <main style={pageStyle}><div style={cardStyle}>Vérification Admin...</div></main>
  if (!isAdmin) return <main style={pageStyle}><div style={{...cardStyle,maxWidth:560,margin:'80px auto',textAlign:'center'}}><h1>Accès Admin protégé</h1><p style={{color:'#667085'}}>Cette page est réservée au compte administrateur WakhReek.</p><a href="/" style={{color:'#0066ff',fontWeight:700}}>Retour à WakhReek</a></div></main>

  return <main style={pageStyle}><div style={{maxWidth:1320,margin:'0 auto'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:24}}><div><h1 style={{margin:0,fontSize:30}}>WakhReek Admin</h1><p style={{margin:'6px 0 0',color:'#667085'}}>Boutiques, paiements et activations</p></div><button onClick={loadAdminData} style={buttonStyle('#0066ff')}>Actualiser</button></div>
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:22}}><Stat label="Boutiques" value={boutiques.length}/><Stat label="Boutiques actives" value={liveCount}/><Stat label="Abonnements en attente" value={pendingCount}/><Stat label="Paiements déclarés" value={submittedCount}/></section>
    {notice && <div style={{...cardStyle,border:'1px solid #12b76a',color:'#027a48',marginBottom:18}}>{notice}</div>}{error && <div style={{...cardStyle,border:'1px solid #f04438',color:'#b42318',marginBottom:18}}>Erreur: {error}</div>}
    {!error && <section style={cardStyle}><h2 style={{marginTop:0}}>Boutiques et paiements</h2>{boutiques.length===0?<p style={{color:'#667085'}}>Aucune boutique pour le moment.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:1250}}><thead><tr>{['Boutique','Plan','Pays','Moyen','Montant','Référence','Paiement déclaré','Abonnement','Boutique','Actions Admin'].map(t=><th key={t} style={thStyle}>{t}</th>)}</tr></thead><tbody>{boutiques.map(b=>{
      const s=subscriptionsByBoutique.get(b.id), busyB=actionBusy===`boutique-${b.id}`, busyS=s&&actionBusy===`subscription-${s.id}`, busy=busyB||busyS
      return <tr key={b.id}><td style={tdStyle}><strong>{b.name}</strong><div style={subStyle}>{b.created_at?new Date(b.created_at).toLocaleDateString('fr-FR'):'-'}</div></td><td style={tdStyle}>{b.plan||'-'}</td><td style={tdStyle}>{s?.country_code||'-'}</td><td style={tdStyle}><strong>{paymentName(s?.payment_method)}</strong><div style={subStyle}>{s?.payment_type||''}</div></td><td style={tdStyle}><strong>{amountText(s)}</strong></td><td style={tdStyle}>{s?.payment_reference||'-'}</td><td style={tdStyle}>{s?.payment_submitted_at?<><strong style={{color:'#027a48'}}>Oui</strong><div style={subStyle}>{new Date(s.payment_submitted_at).toLocaleString('fr-FR')}</div></>:<span style={{color:'#b54708'}}>Pas encore</span>}</td><td style={tdStyle}>{s?.status||'Aucun'}</td><td style={tdStyle}>{b.is_live?<strong style={{color:'#027a48'}}>Active</strong>:<span>Inactive</span>}</td><td style={{...tdStyle,minWidth:290}}><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{!b.is_live&&<button disabled={busy} onClick={()=>setBoutiqueLive(b.id,true,'Boutique activée gratuitement par Admin.')} style={buttonStyle('#7f56d9')}>{busyB?'...':'Activer gratuit'}</button>}{b.is_live&&<button disabled={busy} onClick={()=>setBoutiqueLive(b.id,false,'Boutique désactivée par Admin.')} style={buttonStyle('#667085')}>{busyB?'...':'Désactiver'}</button>}{s?.status==='pending'&&<><button disabled={busy} onClick={()=>approveSubscription(s,b.id)} style={buttonStyle('#12b76a')}>{busyS?'...':'Approuver'}</button><button disabled={busy} onClick={()=>rejectSubscription(s,b.id)} style={buttonStyle('#d92d20')}>{busyS?'...':'Refuser'}</button></>}</div></td></tr>
    })}</tbody></table></div>}</section>}
  </div></main>
}
function Stat({label,value}){return <div style={cardStyle}><div style={{fontSize:13,color:'#667085',marginBottom:7}}>{label}</div><div style={{fontSize:28,fontWeight:800}}>{value}</div></div>}
const pageStyle={minHeight:'100vh',background:'#f4f7fb',padding:24,fontFamily:'Arial, sans-serif',color:'#172033'}
const cardStyle={background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 18px rgba(16,24,40,.06)'}
const thStyle={textAlign:'left',padding:'12px 10px',borderBottom:'1px solid #eaecf0',color:'#667085',fontSize:13}
const tdStyle={padding:'14px 10px',borderBottom:'1px solid #f2f4f7',fontSize:14,verticalAlign:'top'}
const subStyle={fontSize:11,color:'#667085',marginTop:4}
function buttonStyle(background){return{border:0,borderRadius:10,padding:'9px 12px',background,color:'#fff',fontWeight:700,cursor:'pointer'}}
