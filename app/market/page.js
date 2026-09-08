'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/AppShell'
import { supabase } from '../../lib/supabase'

const categories = [
  ['🌿', 'Médecine traditionnelle'], ['🏺', 'Artisanat marocain'], ['🌸', 'Beauté & Bien-être'],
  ['💍', 'Bijoux & Accessoires'], ['🏠', 'Maison & Décoration'], ['👕', 'Mode & Vêtements'],
  ['📱', 'Électronique'], ['🛒', 'Alimentation'], ['📚', 'Livres & Éducation'],
]

const demoProducts = [
  { icon: '🌿', name: 'Huile de Nigelle 100% pure', shop: 'Herboristerie Al Baraka', amount: 8000, rating: '4.8 (120)', image_url: null },
  { icon: '👜', name: 'Sac en cuir artisanal', shop: 'Artisanat du Maroc', amount: 45000, rating: '4.9 (85)', image_url: null },
  { icon: '🧼', name: 'Savon noir marocain', shop: 'Bio Nature', amount: 2500, rating: '4.7 (320)', image_url: null },
  { icon: '🏮', name: 'Lampe marocaine', shop: 'Décor Orient', amount: 15000, rating: '4.6 (64)', image_url: null },
]

const demoBoutiques = [
  { icon: '🌿', name: 'Herboristerie Al Baraka', type: 'Médecine traditionnelle', rating: '4.8', count: 126, live: false },
  { icon: '👜', name: 'Artisanat du Maroc', type: 'Artisanat marocain', rating: '4.9', count: 89, live: true },
  { icon: '🍃', name: 'Bio Nature', type: 'Beauté & Bien-être', rating: '4.7', count: 156, live: false },
]

function money(amount, currency = 'MAD') {
  const value = Number(amount || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  return `${value} ${currency === 'XOF' ? 'CFA' : currency}`
}

export default function MarketPage() {
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [countryCode, setCountryCode] = useState('MAR')
  const [cityId, setCityId] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const brand = document.querySelector('.app-brand strong')
    if (!brand) return
    const oldText = brand.textContent
    brand.textContent = 'WakhReek -Only Talk'
    return () => { brand.textContent = oldText }
  }, [])

  useEffect(() => {
    async function loadLocationData() {
      const [{ data: countryData }, { data: cityData }] = await Promise.all([
        supabase.from('countries').select('id,code,name_fr,flag_emoji,currency_code,market_region').in('market_region', ['north_africa', 'ecowas']).order('name_fr'),
        supabase.from('cities').select('id,country_id,name,slug').order('name'),
      ])
      setCountries(countryData || [])
      setCities(cityData || [])
    }
    loadLocationData()
  }, [])

  const country = useMemo(() => countries.find((item) => item.code === countryCode) || countries.find((item) => item.code === 'MAR') || countries[0], [countries, countryCode])
  const cityOptions = useMemo(() => country ? cities.filter((item) => item.country_id === country.id).slice(0, 10) : [], [cities, country])

  useEffect(() => {
    if (!cityOptions.length) return
    if (!cityOptions.some((item) => item.id === cityId)) setCityId(cityOptions[0].id)
  }, [cityOptions, cityId])

  const city = cityOptions.find((item) => item.id === cityId)
  const currency = country?.currency_code || 'MAD'
  const northAfrica = countries.filter((item) => item.market_region === 'north_africa')
  const ecowas = countries.filter((item) => item.market_region === 'ecowas')

  return (
    <AppShell>
      <div className="market-v2">
        <div className="market-toolbar">
          <button className="market-mobile-menu" onClick={() => setMobileMenu((v) => !v)} aria-label="Menu Marché">☰</button>
          <div className="market-title">🛍 <strong>Marché</strong></div>
          <div className="market-search">⌕ <input placeholder="Rechercher des boutiques, produits..." /></div>
          <div className="market-cart">🛒 Panier <b>2</b></div>
        </div>

        <div className={`market-nav ${mobileMenu ? 'open' : ''}`}>
          <span>Boutiques</span><span>Produits</span><span>Catégories</span><span>Promotions</span><span>Nouveautés</span><span>Top ventes</span>
        </div>

        <div className="tv-strip">
          <strong>📺 WakhReek TV EN DIRECT</strong><em>LIVE</em><i></i>
          <span>• Nouvelle émission: Artisanat en direct • 12 453 spectateurs</span>
        </div>

        <div className="market-location">
          <strong>Votre marché :</strong>
          <label>Pays
            <select value={country?.code || ''} onChange={(e) => setCountryCode(e.target.value)}>
              <optgroup label="Afrique du Nord">
                {northAfrica.map((item) => <option key={item.id} value={item.code}>{item.flag_emoji} {item.name_fr}</option>)}
              </optgroup>
              <optgroup label="CEDEAO / ECOWAS">
                {ecowas.map((item) => <option key={item.id} value={item.code}>{item.flag_emoji} {item.name_fr}</option>)}
              </optgroup>
            </select>
          </label>
          <label>Ville
            <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
              {cityOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <span className="market-location-tag">{country?.flag_emoji} {country?.name_fr} → {city?.name || '...'}</span>
          <span className="market-currency">Devise: <b>{currency === 'XOF' ? 'CFA' : currency}</b></span>
        </div>

        <div className="market-grid">
          <aside className="market-left">
            <section className="market-card categories-card">
              <h3>Catégories</h3>
              {categories.map(([icon, name]) => <button key={name}><span>{icon}</span>{name}<b>›</b></button>)}
              <button className="all-categories">▦ Voir toutes les catégories</button>
            </section>
            <section className="market-card sell-card">
              <h3>Vendez sur WakhReek</h3>
              <p>Ouvrez votre boutique et commencez à vendre vos produits facilement.</p>
              <button onClick={() => { window.location.href = '/market/create' }}>Créer une boutique</button>
            </section>
          </aside>

          <main className="market-center">
            <section className="market-hero">
              <div>
                <h1>Bienvenue sur<br/><span>WAKHREEK <b>MARKET</b></span></h1>
                <p>Découvrez des produits uniques, des boutiques de confiance et des offres exceptionnelles.</p>
                <div><button>🏪 Découvrir les boutiques</button><button>🏷 Voir les promotions</button></div>
              </div>
              <div className="hero-art"><div className="phone">🛍</div><span>🛍️</span><span>📦</span></div>
            </section>

            <section className="market-section">
              <header><h2>Produits populaires</h2><button>Voir tout ›</button></header>
              <div className="product-grid">
                {demoProducts.map((p) => <article className="product-card" key={p.name}>
                  <div className="product-photo">{p.image_url ? <img src={p.image_url} alt={p.name} /> : p.icon}</div>
                  <h4>{p.name}</h4><small>🏪 {p.shop}</small><strong>{money(p.amount, currency)}</strong>
                  <footer><span>⭐ {p.rating}</span><button>♡</button></footer>
                </article>)}
              </div>
            </section>

            <section className="market-section">
              <header><h2>Boutiques recommandées <em>📺 EN DIRECT</em></h2><button>Voir tout ›</button></header>
              <div className="boutique-grid">
                {demoBoutiques.map((b) => <article className="boutique-card" key={b.name}>
                  <div>{b.icon}</div><section><h4>{b.name} {b.live && <em>LIVE</em>}</h4><small>{b.type}</small><p>⭐ {b.rating} · 🏪 {b.count} produits</p></section>
                </article>)}
              </div>
            </section>
          </main>

          <aside className="market-right">
            <section className="market-card day-offer">
              <h3>Offres du jour</h3><small>⏱ Se termine dans</small>
              <div className="countdown"><b>12</b>:<b>45</b>:<b>30</b></div>
              <div className="offer-product"><span>🧴</span><div><b>Huile d'Argan Bio</b><strong>{money(12000, currency)}</strong><del>{money(18000, currency)}</del></div><em>-33%</em></div>
              <button>Voir l'offre</button>
            </section>
            <section className="info-box green"><b>🛡 Paiement sécurisé</b><p>Vos paiements sont sécurisés avec nos partenaires de confiance.</p></section>
            <section className="info-box blue"><b>🚚 Livraison rapide</b><p>Livraison à domicile selon la boutique et la ville.</p></section>
            <section className="info-box gold"><b>🎧 Support 24/7</b><p>Notre équipe est disponible pour vous aider.</p></section>
            <section className="market-card freedom-card"><b>اشتراك متاجر</b><p><strong>حرية كاملة:</strong> لا دخل لنا في الأثمنة ولا كم باع التاجر. يخلص فقط اشتراك البلد لي بغى يبيع فيه. الثمن ديالو هو يحددو، والربح ديالو كامل ليه.</p></section>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .market-v2{margin:-22px;min-height:calc(100vh - 130px);background:#f6f7f9;color:#111;font-family:Arial,Helvetica,sans-serif}
        .market-toolbar{height:62px;background:linear-gradient(90deg,#ff6b00,#ff7900);color:#fff;display:flex;align-items:center;gap:24px;padding:0 24px}.market-title{font-size:25px;white-space:nowrap}.market-search{height:42px;max-width:540px;flex:1;background:#fff;color:#637083;border-radius:10px;display:flex;align-items:center;padding:0 14px;gap:8px}.market-search input{border:0;outline:0;width:100%;font-size:15px}.market-cart{margin-left:auto;font-size:15px}.market-cart b{display:inline-grid;place-items:center;margin-left:6px;background:#fff;color:#1266d8;border-radius:50%;width:27px;height:27px}.market-mobile-menu{display:none;border:0;background:transparent;color:#fff;font-size:24px}
        .market-nav{height:54px;background:linear-gradient(90deg,#0756cf,#087cf0);display:flex;align-items:center;justify-content:center;gap:42px;color:#fff;font-weight:700;font-size:14px;overflow:auto;padding:0 18px}.market-nav span{white-space:nowrap}
        .tv-strip{height:42px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;gap:12px;padding:0 18px;overflow:hidden}.tv-strip strong{font-size:18px;white-space:nowrap}.tv-strip em{font-style:normal;background:#f04432;border-radius:6px;padding:3px 8px;font-size:12px;font-weight:900}.tv-strip i{height:22px;border-left:1px solid #666}.tv-strip span{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .market-location{display:flex;align-items:end;gap:12px;padding:12px 24px;background:#fff;border-bottom:1px solid #e5e7eb;flex-wrap:wrap}.market-location>strong{align-self:center;color:#075dcc}.market-location label{font-size:11px;color:#667085;display:grid;gap:4px}.market-location select{min-width:190px;border:1px solid #d9e0ea;border-radius:8px;padding:8px 10px;background:#fff;color:#111}.market-location-tag,.market-currency{padding:8px 12px;border-radius:20px;background:#eaf3ff;color:#0967cf;font-size:12px;font-weight:700}
        .market-grid{display:grid;grid-template-columns:280px minmax(0,1fr) 280px;gap:18px;padding:22px 24px;max-width:1600px;margin:0 auto}.market-card{background:#fff;border:1px solid #e1e5ea;border-radius:12px;padding:16px}.market-card h3{margin:0 0 12px;font-size:17px}.categories-card button{width:100%;height:42px;border:0;background:#fff;display:grid;grid-template-columns:28px 1fr auto;align-items:center;text-align:left;font-size:13px}.categories-card button:hover{background:#f7f9fc}.categories-card .all-categories{margin-top:9px;border:1px solid #d9e0ea;border-radius:8px;display:block;text-align:center;color:#0869d9;font-weight:700}.sell-card{margin-top:18px}.sell-card p{font-size:13px;line-height:1.55;color:#475467}.sell-card button,.day-offer>button{width:100%;border:0;border-radius:7px;background:#0875e8;color:#fff;padding:11px;font-weight:800}
        .market-center{min-width:0}.market-hero{min-height:286px;border-radius:14px;background:linear-gradient(135deg,#0e58c9,#087df1);color:#fff;display:flex;justify-content:space-between;align-items:center;padding:34px 32px;overflow:hidden}.market-hero h1{font-size:29px;margin:0 0 18px;line-height:1.15}.market-hero h1 span{font-size:32px}.market-hero h1 b{color:#ff7900}.market-hero p{max-width:510px;line-height:1.6;color:#e8f2ff}.market-hero button{border:0;border-radius:8px;padding:12px 15px;margin:8px 8px 0 0;font-weight:800;color:#0c64ca}.market-hero button+button{background:#1987ef;color:#fff}.hero-art{min-width:250px;display:flex;align-items:end;justify-content:center;gap:8px;font-size:45px}.phone{width:145px;height:190px;border-radius:26px;background:#fff;border:13px solid #174e93;color:#ff7900;display:grid;place-items:center;font-size:70px}
        .market-section{margin-top:22px}.market-section>header{display:flex;align-items:center;justify-content:space-between}.market-section h2{font-size:19px;margin:0 0 12px}.market-section header>button{border:0;background:transparent;color:#0969d6;font-weight:700}.market-section h2 em{font-size:10px;background:#f04532;color:#fff;font-style:normal;padding:4px 7px;border-radius:5px}.product-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.product-card{background:#fff;border:1px solid #e1e5ea;border-radius:9px;overflow:hidden;padding-bottom:10px}.product-photo{height:130px;background:linear-gradient(135deg,#f4ead8,#e7d0ad);display:grid;place-items:center;font-size:62px;overflow:hidden}.product-photo img{width:100%;height:100%;object-fit:cover}.product-card h4,.product-card small,.product-card>strong,.product-card footer{margin-left:10px;margin-right:10px}.product-card h4{font-size:13px;margin-top:10px;margin-bottom:6px}.product-card small{display:block;color:#28933c}.product-card>strong{display:block;color:#0866d7;font-size:16px;margin-top:8px}.product-card footer{display:flex;justify-content:space-between;align-items:center;margin-top:9px;font-size:11px}.product-card footer button{border:0;background:transparent;font-size:18px}.boutique-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.boutique-card{background:#fff;border:1px solid #e1e5ea;border-radius:9px;padding:13px;display:flex;gap:12px}.boutique-card>div{width:54px;height:54px;border-radius:50%;background:#eff5ea;display:grid;place-items:center;font-size:30px;flex:0 0 auto}.boutique-card h4{font-size:13px;margin:2px 0 4px}.boutique-card h4 em{font-size:9px;color:#fff;background:#ef4334;border-radius:4px;padding:2px 4px;font-style:normal}.boutique-card small{color:#667085}.boutique-card p{font-size:11px;margin:7px 0 0}
        .market-right{display:grid;align-content:start;gap:16px}.countdown{display:flex;align-items:center;gap:4px;margin:12px 0}.countdown b{background:#fff1e8;color:#f26322;padding:7px;border-radius:6px}.offer-product{display:grid;grid-template-columns:50px 1fr auto;gap:9px;align-items:center;margin:15px 0}.offer-product>span{font-size:38px}.offer-product div{display:grid;gap:4px;font-size:12px}.offer-product strong{color:#0868d9;font-size:15px}.offer-product em{background:#ff6b20;color:#fff;font-style:normal;font-size:11px;padding:4px;border-radius:5px}.info-box{border-radius:11px;padding:17px 18px;border:1px solid}.info-box p{font-size:11px;line-height:1.55;margin:8px 0 0}.info-box.green{background:#f1fbf3;border-color:#d5efda;color:#197b31}.info-box.blue{background:#f2f7ff;border-color:#dbe8fb;color:#1766c2}.info-box.gold{background:#fff8e8;border-color:#f4e5b9;color:#9a6b09}.freedom-card>b{color:#f26816}.freedom-card p{font-size:12px;line-height:1.6;margin-bottom:0}
        @media(max-width:1100px){.market-grid{grid-template-columns:240px 1fr}.market-right{grid-column:1/-1;grid-template-columns:repeat(4,1fr)}.product-grid{grid-template-columns:repeat(2,1fr)}.hero-art{display:none}}
        @media(max-width:760px){.market-v2{margin:-10px}.market-toolbar{height:56px;padding:0 10px;gap:8px}.market-mobile-menu{display:block}.market-title{font-size:17px}.market-search{height:36px}.market-cart{font-size:0}.market-cart b{font-size:12px}.market-nav{display:none;height:auto;flex-direction:column;align-items:stretch;gap:0;padding:6px 10px}.market-nav.open{display:flex}.market-nav span{padding:11px;border-bottom:1px solid rgba(255,255,255,.16)}.tv-strip{justify-content:flex-start}.tv-strip strong{font-size:14px}.market-location{padding:10px}.market-location label{flex:1 1 45%}.market-location select{min-width:0;width:100%}.market-grid{grid-template-columns:1fr;padding:12px}.market-left{order:2}.market-center{order:1}.market-right{order:3;grid-column:auto;grid-template-columns:1fr}.market-hero{min-height:245px;padding:24px 18px}.market-hero h1,.market-hero h1 span{font-size:25px}.product-grid{grid-template-columns:repeat(2,1fr)}.boutique-grid{grid-template-columns:1fr}.categories-card{display:none}}
      `}</style>
    </AppShell>
  )
}
