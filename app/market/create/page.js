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
  const [pricingConfig, setPricingConfig] = useState([])
  const [usdXofRate, setUsdXofRate] = useState(null)
  const [usdXofRateAt, setUsdXofRateAt] = useState(null)
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
      const [{ data: c }, { data: v }, { data: p }, { data: pc }, { data: fx }] = await Promise.all([
        supabase.from('countries').select('id,code,name_fr,flag_emoji,market_region').order('name_fr'),
        supabase.from('cities').select('id,country_id,name').order('name'),
        supabase.from('boutique_plan_catalog').select('code,name_fr,product_limit,monthly_rent_cfa,monthly_with_ads_cfa,monthly_with_ai_cfa,includes_ads,includes_ai,target_segment,all_features').eq('is_active', true).order('id'),
        supabase.from('market_pricing_config').select('country_code,pricing_mode,billing_currency,reference_country_code').eq('is_active', true),
        supabase.from('market_exchange_rates').select('rate,effective_at').eq('base_currency', 'USD').eq('quote_currency', 'XOF').eq('is_active', true).maybeSingle(),
      ])
      setCountries(c || [])
      setCities(v || [])
      setPlans(p || [])
      setPricingConfig(pc || [])
      if (fx?.rate) {
        setUsdXofRate(Number(fx.rate))
        setUsdXofRateAt(fx.effective_at || null)
      }
      const morocco = (c || []).find(x => x.code === 'MAR') || (c || [])[0]
      if (morocco) setCountryId(morocco.id)
    }
    load()
  }, [])

  const cityOptions = useMemo(() => cities.filter(x => x.country_id === countryId), [cities,countryId])
  useEffect(() => {
    if (!cityOptions.some(x => x.id === cityId)) setCityId(cityOptions[0]?.id || '')
  }, [cityOptions,cityId])

  const selectedCountry = useMemo(() => countries.find(c => c.id === countryId), [countries, countryId])
  const selectedPricing = useMemo(() => pricingConfig.find(p => p.country_code === selectedCountry?.code), [pricingConfig, selectedCountry])
  const selectedPlan = useMemo(() => plans.find(p => p.code === planCode) || plans[0], [plans, planCode])
  const isCompany = selectedPlan?.target_segment === 'company' || selectedPlan?.all_features

  useEffect(() => { if (isCompany) setFeatureMode('ai') }, [isCompany])

  const monthlyPrice = useMemo(() => {
    if (!selectedPlan) return 0
    if (isCompany || featureMode === 'ai') return Number(selectedPlan.monthly_with_ai_cfa || selectedPlan.monthly_rent_cfa || 0)
    if (featureMode === 'ads') return Number(selectedPlan.monthly_with_ads_cfa || selectedPlan.monthly_rent_cfa || 0)
    return Number(selectedPlan.monthly_rent_cfa || 0)
  }, [selectedPlan, featureMode, isCompany])

  const billingCurrency = selectedPricing?.billing_currency || 'XOF'
  const billingAmount = useMemo(() => {
    if (billingCurrency === 'XOF') return monthlyPrice
    if (billingCurrency === 'USD' && usdXofRate) return Number((monthlyPrice / usdXofRate).toFixed(2))
    return null
  }, [billingCurrency, monthlyPrice, usdXofRate])

  const hasAds = isCompany || featureMode === 'ads' || featureMode === 'ai'
  const hasAi = isCompany || featureMode === 'ai'

  function formatBilling(cfaAmount) {
    const amount = Number(cfaAmount || 0)
    if (billingCurrency === 'XOF') return `${amount.toLocaleString('fr-FR')} CFA`
    if (billingCurrency === 'USD' && usdXofRate) return `$${(amount / usdXofRate).toFixed(2)} USD`
    return `${amount.toLocaleString('fr-FR')} CFA`
  }

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    if (!name.trim() || !countryId || !cityId || !selectedPlan || !selectedCountry) return setMessage('Complétez le nom, le pays, la ville et la formule.')
    if (!selectedPricing) return setMessage('La configuration tarifaire de ce pays est indisponible.')
    if (billingCurrency === 'USD' && (!usdXofRate || billingAmount == null)) return setMessage('Le taux de conversion USD est indisponible. Réessayez dans un instant.')
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); setMessage('Connectez-vous avant de créer une boutique.'); return }

    const { data: boutique, error: boutiqueError } = await supabase.from('boutiques').insert({
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
    }).select('id').single()

    if (boutiqueError) {
      setSaving(false)
      return setMessage(`Erreur boutique: ${boutiqueError.message}`)
    }

    const { error: subscriptionError } = await supabase.from('subscriptions').insert({
      boutique_id: boutique.id,
      plan: selectedPlan.code,
      country_code: selectedCountry.code,
      amount_cfa: monthlyPrice,
      reference_amount_cfa: monthlyPrice,
      billing_currency: billingCurrency,
      billing_amount: billingAmount,
      exchange_rate: billingCurrency === 'USD' ? usdXofRate : null,
      exchange_rate_at: billingCurrency === 'USD' ? usdXofRateAt : null,
      status: 'pending',
      feature_mode: isCompany ? 'ai' : featureMode,
      has_ads: hasAds,
      has_ai_agent: hasAi,
    })

    setSaving(false)
    if (subscriptionError) {
      return setMessage(`Boutique créée, mais l’abonnement n’a pas pu être enregistré: ${subscriptionError.message}`)
    }

    setMessage(`Demande enregistrée: ${selectedPlan.name_fr} — ${billingCurrency === 'USD' ? `$${billingAmount.toFixed(2)} USD` : `${monthlyPrice.toLocaleString('fr-FR')} CFA`}/mois. L’abonnement est en attente de paiement et de validation.`)
  }

  return <AppShell>
    <main className="create-shop">
      <header><button onClick={() => router.push('/market')}>← Marché</button><div><h1>Créer une boutique</h1><p>Location d’un espace commercial sur WakhReek Market</p></div></header>
      <div className="contract-note"><strong>Principe WakhReek</strong><p>WakhReek loue l’espace de la boutique. Le vendeur reste libre de ses produits, photos, descriptions et prix de vente. Ses bénéfices ou pertes lui appartiennent. La plateforme applique seulement les limites et services de la formule choisie.</p></div>
      <form onSubmit={submit}>
        <section><h2>1. Informations générales</h2><label>Nom de la boutique<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom de votre boutique" /></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Présentez votre activité" /></label></section>
        <section><h2>2. Localisation et type</h2><div className="two"><label>Pays<select value={countryId} onChange={e=>setCountryId(e.target.value)}>{countries.map(c=><option key={c.id} value={c.id}>{c.flag_emoji} {c.name_fr}</option>)}</select></label><label>Ville<select value={cityId} onChange={e=>setCityId(e.target.value)} disabled={!cityOptions.length}>{cityOptions.length ? cityOptions.map(c=><option key={c.id} value={c.id}>{c.name}</option>) : <option value="">Aucune ville enregistrée pour ce pays</option>}</select></label></div><label>Type de boutique<select value={type} onChange={e=>setType(e.target.value)}><option value="physique">Boutique physique</option><option value="en_ligne">Boutique en ligne</option><option value="les_deux">Les deux</option></select></label>{selectedCountry && <div className="billing-note"><strong>Tarification {selectedCountry.flag_emoji} {selectedCountry.name_fr}</strong><span>{billingCurrency === 'XOF' ? 'Même grille CFA que le Sénégal.' : 'Grille internationale en USD, calculée depuis le tarif de référence du Sénégal.'}</span></div>}</section>
        <section><h2>3. Formule de location</h2><p className="hint">Choisissez le nombre de produits que votre boutique pourra afficher.</p><div className="plans">{plans.map(p=><button type="button" key={p.code} className={selectedPlan?.code===p.code?'selected':''} onClick={()=>setPlanCode(p.code)}><strong>{p.name_fr}</strong><small>{p.product_limit == null ? 'Produits illimités' : `Jusqu’à ${p.product_limit} produits`}</small><b>{formatBilling(p.monthly_rent_cfa)} / mois</b>{p.target_segment === 'company' && <em>Entreprises / toutes les fonctionnalités</em>}</button>)}</div></section>
        <section><h2>4. Services de la formule</h2>{isCompany ? <div className="company-box"><strong>Formule Entreprise complète</strong><p>Produits illimités + publicité + agent IA + toutes les fonctionnalités WakhReek Market.</p><b>{formatBilling(selectedPlan?.monthly_with_ai_cfa || selectedPlan?.monthly_rent_cfa)} / mois</b></div> : <div className="features"><label className={featureMode==='rent'?'feature selected':''}><input type="radio" name="features" checked={featureMode==='rent'} onChange={()=>setFeatureMode('rent')} /><span><b>Location seulement</b><small>{formatBilling(selectedPlan?.monthly_rent_cfa)} / mois</small></span></label><label className={featureMode==='ads'?'feature selected':''}><input type="radio" name="features" checked={featureMode==='ads'} onChange={()=>setFeatureMode('ads')} /><span><b>Location + publicité</b><small>{formatBilling(selectedPlan?.monthly_with_ads_cfa)} / mois</small></span></label><label className={featureMode==='ai'?'feature selected':''}><input type="radio" name="features" checked={featureMode==='ai'} onChange={()=>setFeatureMode('ai')} /><span><b>Location + publicité + IA</b><small>{formatBilling(selectedPlan?.monthly_with_ai_cfa)} / mois</small></span></label></div>}</section>
        <section><h2>5. Gestion du stock</h2><p className="hint">Le stock n’est pas une obligation commerciale imposée par WakhReek.</p><label className="radio"><input type="radio" name="stock" checked={stockMode==='optional'} onChange={()=>setStockMode('optional')} /> Je veux indiquer et gérer les quantités en stock</label><label className="radio"><input type="radio" name="stock" checked={stockMode==='hidden'} onChange={()=>setStockMode('hidden')} /> Je préfère ne pas communiquer mon stock</label></section>
        <div className="summary"><div><small>Formule choisie</small><b>{selectedPlan?.name_fr || 'Chargement...'}</b></div><div><small>Services</small><b>{isCompany ? 'Toutes fonctionnalités' : featureMode === 'ai' ? 'Publicité + IA' : featureMode === 'ads' ? 'Publicité' : 'Location seulement'}</b></div><div className="price"><small>Total mensuel</small><strong>{billingAmount == null ? '—' : billingCurrency === 'USD' ? `$${billingAmount.toFixed(2)} USD` : `${billingAmount.toLocaleString('fr-FR')} CFA`}</strong>{billingCurrency === 'USD' && <small>Référence: {monthlyPrice.toLocaleString('fr-FR')} CFA</small>}</div></div>
        <p className="activation-note">Après soumission, un abonnement en attente est créé. La boutique reste inactive jusqu’au paiement et à sa validation.</p>
        {message && <p className="message">{message}</p>}<button className="submit" disabled={saving || !selectedPlan}>{saving?'Enregistrement...':'Soumettre la demande de boutique'}</button>
      </form>
    </main>
    <style jsx>{`
      .create-shop{max-width:980px;margin:0 auto;padding:24px;color:#172033}.create-shop>header{display:flex;gap:18px;align-items:center;margin-bottom:18px}.create-shop>header button{border:1px solid #d6deea;background:white;border-radius:9px;padding:10px 14px}.create-shop h1{margin:0;color:#075dcc}.create-shop header p{margin:5px 0;color:#667085}.contract-note{background:#fff7e8;border:1px solid #ffd48a;border-radius:12px;padding:16px;margin-bottom:18px}.contract-note strong{color:#b85a00}.contract-note p{margin:7px 0 0;line-height:1.6}form{display:grid;gap:16px}section{background:white;border:1px solid #e1e6ee;border-radius:12px;padding:20px}h2{font-size:18px;margin:0 0 16px;color:#075dcc}label{display:grid;gap:6px;margin:12px 0;font-size:13px;font-weight:700}input,textarea,select{border:1px solid #ccd5e2;border-radius:8px;padding:11px;font:inherit;background:white}textarea{min-height:90px;resize:vertical}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.billing-note{display:grid;gap:4px;margin-top:14px;padding:12px;border-radius:10px;background:#eef6ff;border:1px solid #cfe4ff}.billing-note strong{color:#075dcc}.billing-note span{font-size:12px;color:#667085}.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.plans button{border:2px solid #dbe3ee;background:#fff;border-radius:12px;padding:18px;text-align:left;display:grid;gap:7px}.plans button.selected{border-color:#0875e8;background:#eef6ff}.plans small{color:#667085}.plans b{color:#075dcc}.plans em{font-style:normal;font-size:11px;color:#b85a00}.hint{color:#667085;font-size:13px}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.feature{border:2px solid #dbe3ee;border-radius:12px;padding:14px;display:flex;gap:10px;align-items:flex-start;margin:0;cursor:pointer}.feature.selected{border-color:#0875e8;background:#eef6ff}.feature span{display:grid;gap:6px}.feature small{color:#667085}.company-box{background:#f4f0ff;border:1px solid #d9caff;border-radius:12px;padding:16px}.company-box strong{color:#6537b8}.company-box p{margin:7px 0;color:#5b6472}.company-box b{color:#6537b8}.radio{display:flex;align-items:center;gap:9px;font-weight:500}.summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;background:#edf7ff;border-radius:10px;padding:16px;color:#075dcc}.summary div{display:grid;gap:5px}.summary small{color:#667085}.summary .price{text-align:right}.summary strong{font-size:22px}.activation-note{margin:0;color:#667085;font-size:13px}.message{padding:12px;background:#fff7e8;border-radius:8px}.submit{border:0;border-radius:10px;padding:14px;background:#0875e8;color:#fff;font-weight:900;font-size:15px}.submit:disabled{opacity:.6}@media(max-width:700px){.create-shop{padding:12px}.two,.plans,.features,.summary{grid-template-columns:1fr}.summary .price{text-align:left}.create-shop>header{align-items:flex-start}}
    `}</style>
  </AppShell>
}