'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../../../components/AppShell'
import { supabase } from '../../../lib/supabase'

export default function CreateBoutiquePage() {
  const router = useRouter()
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [plans, setPlans] = useState([])
  const [countryId, setCountryId] = useState('')
  const [cityId, setCityId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('les_deux')
  const [planCode, setPlanCode] = useState('eco_15')
  const [featureMode, setFeatureMode] = useState('rent')
  const [stockMode, setStockMode] = useState('optional')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: v }, { data: p }] = await Promise.all([
        supabase.from('countries').select('id,code,name_fr,flag_emoji,market_region').in('market_region', ['north_africa','ecowas']).order('name_fr'),
        supabase.from('cities').select('id,country_id,name').order('name'),
        supabase.from('boutique_plan_catalog').select('code,name_fr,product_limit,monthly_rent_cfa,monthly_with_ads_cfa,monthly_with_ai_cfa,includes_ads,includes_ai,target_segment,all_features').eq('is_active', true).order('id'),
      ])
      setCountries(c || [])
      setCities(v || [])
      setPlans(p || [])
      const morocco = (c || []).find(x => x.code === 'MAR') || (c || [])[0]
      if (morocco) setCountryId(morocco.id)
    }
    load()
  }, [])

  const cityOptions = useMemo(() => cities.filter(x => x.country_id === countryId).slice(0,10), [cities,countryId])
  useEffect(() => { if (cityOptions.length && !cityOptions.some(x => x.id === cityId)) setCityId(cityOptions[0].id) }, [cityOptions,cityId])

  const selectedPlan = useMemo(() => plans.find(p => p.code === planCode) || plans[0], [plans, planCode])
  const isCompany = selectedPlan?.target_segment === 'company' || selectedPlan?.all_features

  useEffect(() => {
    if (isCompany) setFeatureMode('ai')
  }, [isCompany])

  const monthlyPrice = useMemo(() => {
    if (!selectedPlan) return 0
    if (isCompany) return selectedPlan.monthly_with_ai_cfa || selectedPlan.monthly_rent_cfa || 0
    if (featureMode === 'ai') return selectedPlan.monthly_with_ai_cfa || selectedPlan.monthly_rent_cfa || 0
    if (featureMode === 'ads') return selectedPlan.monthly_with_ads_cfa || selectedPlan.monthly_rent_cfa || 0
    return selectedPlan.monthly_rent_cfa || 0
  }, [selectedPlan, featureMode, isCompany])

  const hasAds = isCompany || featureMode === 'ads' || featureMode === 'ai'
  const hasAi = isCompany || featureMode === 'ai'

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    if (!name.trim() || !countryId || !cityId || !selectedPlan) return setMessage('Complétez le nom, le pays, la ville et la formule.')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); setMessage('Connectez-vous avant de créer une boutique.'); return }

    const { error } = await supabase.from('boutiques').insert({
      user_id: user.id,
      country_id: countryId,
      city_id: cityId,
      name: name.trim(),
      description: description.trim() || null,
      type,
      plan: selectedPlan.code,
      product_count_limit: selectedPlan.product_limit,
      has_ads: hasAds,
      has_ai_agent: hasAi,
      is_live: false,
    })

    setSaving(false)
    if (error) return setMessage(`Erreur: ${error.message}`)
    setMessage(`Boutique enregistrée. Formule: ${selectedPlan.name_fr} — ${monthlyPrice.toLocaleString('fr-FR')} CFA/mois. Elle reste inactive jusqu’à validation de l’abonnement.`)
  }

  return <AppShell>
    <main className="create-shop">
      <header><button onClick={() => router.push('/market')}>← Marché</button><div><h1>Créer une boutique</h1><p>Location d’un espace commercial sur WakhReek Market</p></div></header>

      <div className="contract-note">
        <strong>Principe WakhReek</strong>
        <p>WakhReek loue l’espace de la boutique. Le vendeur reste libre de ses produits, photos, descriptions et prix de vente. Ses bénéfices ou pertes lui appartiennent. La plateforme applique seulement les limites et services de la formule choisie.</p>
      </div>

      <form onSubmit={submit}>
        <section>
          <h2>1. Informations générales</h2>
          <label>Nom de la boutique<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom de votre boutique" /></label>
          <label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Présentez votre activité" /></label>
        </section>

        <section>
          <h2>2. Localisation et type</h2>
          <div className="two">
            <label>Pays<select value={countryId} onChange={e=>setCountryId(e.target.value)}>{countries.map(c=><option key={c.id} value={c.id}>{c.flag_emoji} {c.name_fr}</option>)}</select></label>
            <label>Ville<select value={cityId} onChange={e=>setCityId(e.target.value)}>{cityOptions.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          </div>
          <label>Type de boutique<select value={type} onChange={e=>setType(e.target.value)}><option value="physique">Boutique physique</option><option value="en_ligne">Boutique en ligne</option><option value="les_deux">Les deux</option></select></label>
        </section>

        <section>
          <h2>3. Formule de location</h2>
          <p className="hint">Choisissez le nombre de produits que votre boutique pourra afficher.</p>
          <div className="plans">
            {plans.map(p=><button type="button" key={p.code} className={selectedPlan?.code===p.code?'selected':''} onClick={()=>setPlanCode(p.code)}>
              <strong>{p.name_fr}</strong>
              <small>{p.product_limit == null ? 'Produits illimités' : `Jusqu’à ${p.product_limit} produits`}</small>
              <b>{Number(p.monthly_rent_cfa || 0).toLocaleString('fr-FR')} CFA / mois</b>
              {p.target_segment === 'company' && <em>Entreprises / toutes les fonctionnalités</em>}
            </button>)}
          </div>
        </section>

        <section>
          <h2>4. Services de la formule</h2>
          {isCompany ? (
            <div className="company-box"><strong>Formule Entreprise complète</strong><p>Produits illimités + publicité + agent IA + toutes les fonctionnalités WakhReek Market.</p></div>
          ) : (
            <div className="features">
              <label className={featureMode==='rent'?'feature selected':''}><input type="radio" name="features" checked={featureMode==='rent'} onChange={()=>setFeatureMode('rent')} /><span><b>Location seulement</b><small>{Number(selectedPlan?.monthly_rent_cfa || 0).toLocaleString('fr-FR')} CFA / mois</small></span></label>
              <label className={featureMode==='ads'?'feature selected':''}><input type="radio" name="features" checked={featureMode==='ads'} onChange={()=>setFeatureMode('ads')} /><span><b>Location + publicité</b><small>{Number(selectedPlan?.monthly_with_ads_cfa || 0).toLocaleString('fr-FR')} CFA / mois</small></span></label>
              <label className={featureMode==='ai'?'feature selected':''}><input type="radio" name="features" checked={featureMode==='ai'} onChange={()=>setFeatureMode('ai')} /><span><b>Location + publicité + IA</b><small>{Number(selectedPlan?.monthly_with_ai_cfa || 0).toLocaleString('fr-FR')} CFA / mois</small></span></label>
            </div>
          )}
        </section>

        <section>
          <h2>5. Gestion du stock</h2>
          <p className="hint">Le stock n’est pas une obligation commerciale imposée par WakhReek.</p>
          <label className="radio"><input type="radio" name="stock" checked={stockMode==='optional'} onChange={()=>setStockMode('optional')} /> Je veux indiquer et gérer les quantités en stock</label>
          <label className="radio"><input type="radio" name="stock" checked={stockMode==='hidden'} onChange={()=>setStockMode('hidden')} /> Je préfère ne pas communiquer mon stock</label>
        </section>

        <div className="summary">
          <div><small>Formule choisie</small><b>{selectedPlan?.name_fr || 'Chargement...'}</b></div>
          <div><small>Services</small><b>{isCompany ? 'Toutes fonctionnalités' : featureMode === 'ai' ? 'Publicité + IA' : featureMode === 'ads' ? 'Publicité' : 'Location seulement'}</b></div>
          <div className="price"><small>Total mensuel</small><strong>{monthlyPrice.toLocaleString('fr-FR')} CFA</strong></div>
        </div>

        <p className="activation-note">La boutique sera créée inactive jusqu’à validation de l’abonnement.</p>
        {message && <p className="message">{message}</p>}
        <button className="submit" disabled={saving || !selectedPlan}>{saving?'Enregistrement...':'Soumettre la demande de boutique'}</button>
      </form>
    </main>

    <style jsx>{`
      .create-shop{max-width:980px;margin:0 auto;padding:24px;color:#172033}.create-shop>header{display:flex;gap:18px;align-items:center;margin-bottom:18px}.create-shop>header button{border:1px solid #d6deea;background:white;border-radius:9px;padding:10px 14px}.create-shop h1{margin:0;color:#075dcc}.create-shop header p{margin:5px 0;color:#667085}.contract-note{background:#fff7e8;border:1px solid #ffd48a;border-radius:12px;padding:16px;margin-bottom:18px}.contract-note strong{color:#b85a00}.contract-note p{margin:7px 0 0;line-height:1.6}form{display:grid;gap:16px}section{background:white;border:1px solid #e1e6ee;border-radius:12px;padding:20px}h2{font-size:18px;margin:0 0 16px;color:#075dcc}label{display:grid;gap:6px;margin:12px 0;font-size:13px;font-weight:700}input,textarea,select{border:1px solid #ccd5e2;border-radius:8px;padding:11px;font:inherit;background:white}textarea{min-height:90px;resize:vertical}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.plans button{border:2px solid #dbe3ee;background:#fff;border-radius:12px;padding:18px;text-align:left;display:grid;gap:7px}.plans button.selected{border-color:#0875e8;background:#eef6ff}.plans small{color:#667085}.plans b{color:#075dcc}.plans em{font-style:normal;font-size:11px;color:#b85a00}.hint{color:#667085;font-size:13px}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.feature{border:2px solid #dbe3ee;border-radius:12px;padding:14px;display:flex;gap:10px;align-items:flex-start;margin:0;cursor:pointer}.feature.selected{border-color:#0875e8;background:#eef6ff}.feature span{display:grid;gap:6px}.feature small{color:#667085}.company-box{background:#f4f0ff;border:1px solid #d9caff;border-radius:12px;padding:16px}.company-box strong{color:#6537b8}.company-box p{margin:7px 0 0;color:#5b6472}.radio{display:flex;align-items:center;gap:9px;font-weight:500}.summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;background:#edf7ff;border-radius:10px;padding:16px;color:#075dcc}.summary div{display:grid;gap:5px}.summary small{color:#667085}.summary .price{text-align:right}.summary strong{font-size:22px}.activation-note{margin:0;color:#667085;font-size:13px}.message{padding:12px;background:#fff7e8;border-radius:8px}.submit{border:0;border-radius:10px;padding:14px;background:#0875e8;color:#fff;font-weight:900;font-size:15px}.submit:disabled{opacity:.6}@media(max-width:700px){.create-shop{padding:12px}.two,.plans,.features,.summary{grid-template-columns:1fr}.summary .price{text-align:left}.create-shop>header{align-items:flex-start}}
    `}</style>
  </AppShell>
}
