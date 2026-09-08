'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../../../components/AppShell'
import { supabase } from '../../../lib/supabase'

const plans = [
  { id: '15', title: '15 produits', note: 'Jusqu’à 15 produits affichés' },
  { id: '45', title: '45 produits', note: 'Jusqu’à 45 produits affichés' },
  { id: 'unlimited', title: 'Sans limite', note: 'Nombre de produits illimité' },
]

export default function CreateBoutiquePage() {
  const router = useRouter()
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [countryId, setCountryId] = useState('')
  const [cityId, setCityId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('les_deux')
  const [plan, setPlan] = useState('15')
  const [stockMode, setStockMode] = useState('optional')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: v }] = await Promise.all([
        supabase.from('countries').select('id,code,name_fr,flag_emoji,market_region').in('market_region', ['north_africa','ecowas']).order('name_fr'),
        supabase.from('cities').select('id,country_id,name').order('name'),
      ])
      setCountries(c || [])
      setCities(v || [])
      const morocco = (c || []).find(x => x.code === 'MAR') || (c || [])[0]
      if (morocco) setCountryId(morocco.id)
    }
    load()
  }, [])

  const cityOptions = useMemo(() => cities.filter(x => x.country_id === countryId).slice(0,10), [cities,countryId])
  useEffect(() => { if (cityOptions.length && !cityOptions.some(x => x.id === cityId)) setCityId(cityOptions[0].id) }, [cityOptions,cityId])

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    if (!name.trim() || !countryId || !cityId) return setMessage('Complétez le nom, le pays et la ville.')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); setMessage('Connectez-vous avant de créer une boutique.'); return }
    const limit = plan === 'unlimited' ? null : Number(plan)
    const { error } = await supabase.from('boutiques').insert({
      user_id: user.id, country_id: countryId, city_id: cityId,
      name: name.trim(), description: description.trim() || null,
      type, plan, product_count_limit: limit, is_live: false,
    })
    setSaving(false)
    if (error) return setMessage(`Erreur: ${error.message}`)
    setMessage('Boutique enregistrée. Elle reste inactive jusqu’à validation de son abonnement.')
  }

  return <AppShell>
    <main className="create-shop">
      <header><button onClick={() => router.push('/market')}>← Marché</button><div><h1>Créer une boutique</h1><p>Location d’un espace commercial sur WakhReek Market</p></div></header>
      <div className="contract-note"><strong>Principe WakhReek</strong><p>WakhReek loue l’espace de la boutique. Le vendeur reste libre de ses produits, photos, descriptions et prix de vente. Ses bénéfices ou pertes lui appartiennent. La plateforme limite uniquement le nombre de produits affichables selon l’abonnement choisi.</p></div>
      <form onSubmit={submit}>
        <section><h2>1. Informations générales</h2><label>Nom de la boutique<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom de votre boutique" /></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Présentez votre activité" /></label></section>
        <section><h2>2. Localisation et type</h2><div className="two"><label>Pays<select value={countryId} onChange={e=>setCountryId(e.target.value)}>{countries.map(c=><option key={c.id} value={c.id}>{c.flag_emoji} {c.name_fr}</option>)}</select></label><label>Ville<select value={cityId} onChange={e=>setCityId(e.target.value)}>{cityOptions.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><label>Type de boutique<select value={type} onChange={e=>setType(e.target.value)}><option value="physique">Boutique physique</option><option value="en_ligne">Boutique en ligne</option><option value="les_deux">Les deux</option></select></label></section>
        <section><h2>3. Contrat de location / abonnement</h2><p className="hint">Le prix de chaque formule sera appliqué selon le tarif WakhReek du pays. Aucun prix d’abonnement n’est inventé ici.</p><div className="plans">{plans.map(p=><button type="button" key={p.id} className={plan===p.id?'selected':''} onClick={()=>setPlan(p.id)}><strong>{p.title}</strong><small>{p.note}</small></button>)}</div></section>
        <section><h2>4. Gestion du stock</h2><p className="hint">Le stock n’est pas une obligation commerciale imposée par WakhReek.</p><label className="radio"><input type="radio" name="stock" checked={stockMode==='optional'} onChange={()=>setStockMode('optional')} /> Je veux indiquer et gérer les quantités en stock</label><label className="radio"><input type="radio" name="stock" checked={stockMode==='hidden'} onChange={()=>setStockMode('hidden')} /> Je préfère ne pas communiquer mon stock</label></section>
        <div className="summary"><b>Formule choisie : {plan === 'unlimited' ? 'Sans limite' : `${plan} produits`}</b><span>La boutique sera créée inactive jusqu’à validation de l’abonnement.</span></div>
        {message && <p className="message">{message}</p>}<button className="submit" disabled={saving}>{saving?'Enregistrement...':'Soumettre la demande de boutique'}</button>
      </form>
    </main>
    <style jsx>{`
      .create-shop{max-width:980px;margin:0 auto;padding:24px;color:#172033}.create-shop>header{display:flex;gap:18px;align-items:center;margin-bottom:18px}.create-shop>header button{border:1px solid #d6deea;background:white;border-radius:9px;padding:10px 14px}.create-shop h1{margin:0;color:#075dcc}.create-shop header p{margin:5px 0;color:#667085}.contract-note{background:#fff7e8;border:1px solid #ffd48a;border-radius:12px;padding:16px;margin-bottom:18px}.contract-note strong{color:#b85a00}.contract-note p{margin:7px 0 0;line-height:1.6}form{display:grid;gap:16px}section{background:white;border:1px solid #e1e6ee;border-radius:12px;padding:20px}h2{font-size:18px;margin:0 0 16px;color:#075dcc}label{display:grid;gap:6px;margin:12px 0;font-size:13px;font-weight:700}input,textarea,select{border:1px solid #ccd5e2;border-radius:8px;padding:11px;font:inherit;background:white}textarea{min-height:90px;resize:vertical}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.plans button{border:2px solid #dbe3ee;background:#fff;border-radius:12px;padding:18px;text-align:left}.plans button.selected{border-color:#0875e8;background:#eef6ff}.plans strong,.plans small{display:block}.plans small{margin-top:7px;color:#667085}.hint{color:#667085;font-size:13px}.radio{display:flex;align-items:center;gap:9px;font-weight:500}.summary{display:flex;justify-content:space-between;gap:12px;background:#edf7ff;border-radius:10px;padding:14px;color:#075dcc}.message{padding:12px;background:#fff7e8;border-radius:8px}.submit{border:0;border-radius:10px;padding:14px;background:#0875e8;color:#fff;font-weight:900;font-size:15px}.submit:disabled{opacity:.6}@media(max-width:700px){.create-shop{padding:12px}.two,.plans{grid-template-columns:1fr}.summary{display:grid}.create-shop>header{align-items:flex-start}}
    `}</style>
  </AppShell>
}
