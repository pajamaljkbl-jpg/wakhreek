'use client'

import { useMemo, useState } from 'react'
import AppShell from '../../components/AppShell'

const countries = [
  { id: 'MA', name: 'Maroc', flag: '🇲🇦', cities: ['Casablanca', 'Marrakech', 'Fès', 'Tanger', 'Rabat', 'Agadir', 'Oujda', 'Meknès'] },
  { id: 'SN', name: 'Sénégal', flag: '🇸🇳', cities: ['Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis'] },
  { id: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', cities: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'Daloa'] },
  { id: 'ML', name: 'Mali', flag: '🇲🇱', cities: ['Bamako', 'Sikasso', 'Mopti'] },
  { id: 'DZ', name: 'Algérie', flag: '🇩🇿', cities: ['Alger', 'Oran', 'Constantine'] },
  { id: 'TN', name: 'Tunisie', flag: '🇹🇳', cities: ['Tunis', 'Sfax', 'Sousse'] },
]

const categories = [
  ['🌿', 'Médecine traditionnelle'], ['🏺', 'Artisanat marocain'], ['🌸', 'Beauté & Bien-être'],
  ['💍', 'Bijoux & Accessoires'], ['🏠', 'Maison & Décoration'], ['👕', 'Mode & Vêtements'],
  ['📱', 'Électronique'], ['🛒', 'Alimentation'], ['📚', 'Livres & Éducation'],
]

const products = [
  { icon: '🌿', name: 'Huile de Nigelle 100% pure', shop: 'Herboristerie Al Baraka', price: '8 000 CFA', rating: '4.8 (120)' },
  { icon: '👜', name: 'Sac en cuir artisanal', shop: 'Artisanat du Maroc', price: '45 000 CFA', rating: '4.9 (85)' },
  { icon: '🧼', name: 'Savon noir marocain', shop: 'Bio Nature', price: '2 500 CFA', rating: '4.7 (320)' },
  { icon: '🏮', name: 'Lampe marocaine', shop: 'Décor Orient', price: '15 000 CFA', rating: '4.6 (64)' },
]

const boutiques = [
  { icon: '🌿', name: 'Herboristerie Al Baraka', type: 'Médecine traditionnelle', rating: '4.8', count: 126, live: false },
  { icon: '👜', name: 'Artisanat du Maroc', type: 'Artisanat marocain', rating: '4.9', count: 89, live: true },
  { icon: '🍃', name: 'Bio Nature', type: 'Beauté & Bien-être', rating: '4.7', count: 156, live: false },
]

export default function MarketPage() {
  const [countryId, setCountryId] = useState('MA')
  const country = countries.find((item) => item.id === countryId) || countries[0]
  const [city, setCity] = useState('Casablanca')

  const cityOptions = useMemo(() => country.cities, [country])

  function changeCountry(value) {
    const next = countries.find((item) => item.id === value) || countries[0]
    setCountryId(next.id)
    setCity(next.cities[0])
  }

  return (
    <AppShell>
      <div className="market-v2">
        <div className="market-toolbar">
          <div className="market-title">🛍 <strong>Marché</strong></div>
          <div className="market-search">⌕ <input placeholder="Rechercher des boutiques, produits..." /></div>
          <div className="market-cart">🛒 Panier <b>2</b></div>
        </div>

        <div className="market-nav">
          <span>Boutiques</span><span>Produits</span><span>Catégories</span><span>Promotions</span><span>Nouveautés</span><span>Top ventes</span>
        </div>

        <div className="tv-strip">
          <strong>📺 WakhReek TV EN DIRECT</strong><em>LIVE</em><i></i>
          <span>• Nouvelle émission: Artisanat en direct • 12 453 spectateurs</span>
        </div>

        <div className="market-location">
          <strong>Votre marché :</strong>
          <label>Pays
            <select value={countryId} onChange={(e) => changeCountry(e.target.value)}>
              {countries.map((item) => <option key={item.id} value={item.id}>{item.flag} {item.name}</option>)}
            </select>
          </label>
          <label>Ville
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cityOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <span className="market-location-tag">{country.flag} {country.name} → {city}</span>
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
              <button>Créer une boutique</button>
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
                {products.map((p) => <article className="product-card" key={p.name}>
                  <div className="product-photo">{p.icon}</div>
                  <h4>{p.name}</h4><small>🏪 {p.shop}</small><strong>{p.price}</strong>
                  <footer><span>⭐ {p.rating}</span><button>♡</button></footer>
                </article>)}
              </div>
            </section>

            <section className="market-section">
              <header><h2>Boutiques recommandées <em>📺 EN DIRECT</em></h2><button>Voir tout ›</button></header>
              <div className="boutique-grid">
                {boutiques.map((b) => <article className="boutique-card" key={b.name}>
                  <div>{b.icon}</div><section><h4>{b.name} {b.live && <em>LIVE</em>}</h4><small>{b.type}</small><p>⭐ {b.rating} · 🏪 {b.count} produits</p></section>
                </article>)}
              </div>
            </section>
          </main>

          <aside className="market-right">
            <section className="market-card day-offer">
              <h3>Offres du jour</h3><small>⏱ Se termine dans</small>
              <div className="countdown"><b>12</b>:<b>45</b>:<b>30</b></div>
              <div className="offer-product"><span>🧴</span><div><b>Huile d'Argan Bio</b><strong>12 000 CFA</strong><del>18 000 CFA</del></div><em>-33%</em></div>
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
        .market-toolbar{height:62px;background:linear-gradient(90deg,#ff6b00,#ff7900);color:#fff;display:flex;align-items:center;gap:24px;padding:0 24px}.market-title{font-size:25px;white-space:nowrap}.market-search{height:42px;max-width:540px;flex:1;background:#fff;color:#637083;border-radius:10px;display:flex;align-items:center;padding:0 14px;gap:8px}.market-search input{border:0;outline:0;width:100%;font-size:15px}.market-cart{margin-left:auto;font-size:15px}.market-cart b{display:inline-grid;place-items:center;margin-left:6px;background:#fff;color:#1266d8;border-radius:50%;width:27px;height:27px}
        .market-nav{height:54px;background:linear-gradient(90deg,#0756cf,#087cf0);display:flex;align-items:center;justify-content:center;gap:42px;color:#fff;font-weight:700;font-size:14px;overflow:auto;padding:0 18px}.market-nav span{white-space:nowrap}
        .tv-strip{height:42px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;gap:12px;padding:0 18px;overflow:hidden}.tv-strip strong{font-size:18px;white-space:nowrap}.tv-strip em{font-style:normal;background:#f04432;border-radius:6px;padding:3px 8px;font-size:12px;font-weight:900}.tv-strip i{height:22px;border-left:1px solid #666}.tv-strip span{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .market-location{display:flex;align-items:end;gap:12px;padding:12px 24px;background:#fff;border-bottom:1px solid #e5e7eb;flex-wrap:wrap}.market-location>strong{align-self:center;color:#075dcc}.market-location label{font-size:11px;color:#667085;display:grid;gap:4px}.market-location select{min-width:170px;border:1px solid #d9e0ea;border-radius:8px;padding:8px 10px;background:#fff;color:#111}.market-location-tag{padding:8px 12px;border-radius:20px;background:#eaf3ff;color:#0967cf;font-size:12px;font-weight:700}
        .market-grid{display:grid;grid-template-columns:280px minmax(0,1fr) 280px;gap:18px;padding:22px 24px;max-width:1600px;margin:0 auto}.market-card{background:#fff;border:1px solid #e1e5ea;border-radius:12px;padding:16px}.market-card h3{margin:0 0 12px;font-size:17px}.categories-card button{width:100%;height:42px;border:0;background:#fff;display:grid;grid-template-columns:28px 1fr auto;align-items:center;text-align:left;font-size:13px}.categories-card button:hover{background:#f7f9fc}.categories-card button b{color:#7b8794}.categories-card .all-categories{margin-top:9px;border:1px solid #d9e0ea;border-radius:8px;display:block;text-align:center;color:#0869d9;font-weight:700}.sell-card{margin-top:18px}.sell-card p{font-size:13px;line-height:1.55;color:#475467}.sell-card button,.day-offer>button{width:100%;border:0;border-radius:7px;background:#0875e8;color:#fff;padding:11px;font-weight:800}
        .market-center{min-width:0}.market-hero{min-height:286px;border-radius:14px;background:linear-gradient(135deg,#0e58c9,#087df1);color:#fff;display:flex;justify-content:space-between;align-items:center;padding:34px 32px;overflow:hidden}.market-hero h1{font-size:29px;margin:0 0 18px;line-height:1.15}.market-hero h1 span{font-size:32px}.market-hero h1 b{color:#ff7900}.market-hero p{max-width:510px;line-height:1.6;color:#e8f2ff}.market-hero button{border:0;border-radius:8px;padding:12px 15px;margin:8px 8px 0 0;font-weight:800;color:#0c64ca}.market-hero button+button{background:#1987ef;color:#fff;border:1px solid rgba(255,255,255,.15)}.hero-art{min-width:250px;position:relative;display:flex;align-items:end;justify-content:center;gap:8px;font-size:45px}.phone{width:145px;height:190px;border-radius:26px;background:#fff;border:13px solid #174e93;color:#ff7900;display:grid;place-items:center;font-size:70px;box-shadow:0 18px 35px rgba(0,0,0,.2)}
        .market-section{margin-top:22px}.market-section>header{display:flex;align-items:center;justify-content:space-between}.market-section h2{font-size:19px;margin:0 0 12px}.market-section header>button{border:0;background:transparent;color:#0969d6;font-weight:700}.market-section h2 em{font-size:10px;background:#f04532;color:#fff;font-style:normal;padding:4px 7px;border-radius:5px}.product-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.product-card{background:#fff;border:1px solid #e1e5ea;border-radius:9px;overflow:hidden;padding-bottom:10px}.product-photo{height:130px;background:linear-gradient(135deg,#f4ead8,#e7d0ad);display:grid;place-items:center;font-size:62px}.product-card h4,.product-card small,.product-card>strong,.product-card footer{margin-left:10px;margin-right:10px}.product-card h4{font-size:13px;margin-top:10px;margin-bottom:6px}.product-card small{display:block;color:#28933c}.product-card>strong{display:block;color:#0866d7;font-size:16px;margin-top:8px}.product-card footer{display:flex;justify-content:space-between;align-items:center;margin-top:9px;font-size:11px}.product-card footer button{border:0;background:transparent;font-size:18px}.boutique-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.boutique-card{background:#fff;border:1px solid #e1e5ea;border-radius:9px;padding:13px;display:flex;gap:12px}.boutique-card>div{width:54px;height:54px;border-radius:50%;background:#eff5ea;display:grid;place-items:center;font-size:30px;flex:0 0 auto}.boutique-card h4{font-size:13px;margin:2px 0 4px}.boutique-card h4 em{font-size:9px;color:#fff;background:#ef4334;border-radius:4px;padding:2px 4px;font-style:normal}.boutique-card small{color:#667085}.boutique-card p{font-size:11px;margin:7px 0 0}
        .market-right{display:grid;align-content:start;gap:16px}.day-offer small{color:#667085}.countdown{display:flex;align-items:center;gap:4px;margin:12px 0}.countdown b{background:#fff1e8;color:#f26322;padding:7px;border-radius:6px}.offer-product{display:grid;grid-template-columns:50px 1fr auto;gap:9px;align-items:center;margin:15px 0}.offer-product>span{font-size:38px}.offer-product div{display:grid;gap:4px;font-size:12px}.offer-product strong{color:#0868d9;font-size:15px}.offer-product del{color:#8a8f98}.offer-product em{background:#ff6b20;color:#fff;font-style:normal;font-size:11px;padding:4px;border-radius:5px}.info-box{border-radius:11px;padding:17px 18px;border:1px solid}.info-box b{font-size:14px}.info-box p{font-size:11px;line-height:1.55;margin:8px 0 0}.info-box.green{background:#f1fbf3;border-color:#d5efda;color:#197b31}.info-box.blue{background:#f2f7ff;border-color:#dbe8fb;color:#1766c2}.info-box.gold{background:#fff8e8;border-color:#f4e5b9;color:#9a6b09}.freedom-card>b{color:#f26816}.freedom-card p{font-size:12px;line-height:1.6;margin-bottom:0}
        @media(max-width:1100px){.market-grid{grid-template-columns:240px 1fr}.market-right{grid-column:1/-1;grid-template-columns:repeat(4,1fr)}.product-grid{grid-template-columns:repeat(2,1fr)}.hero-art{display:none}}
        @media(max-width:760px){.market-v2{margin:-10px}.market-toolbar{padding:0 10px;gap:8px}.market-title{font-size:18px}.market-search{height:38px}.market-cart{font-size:0}.market-cart b{font-size:12px}.market-nav{justify-content:flex-start;gap:26px}.tv-strip{justify-content:flex-start}.tv-strip strong{font-size:14px}.market-location{padding:10px}.market-location label{flex:1}.market-location select{min-width:0;width:100%}.market-grid{grid-template-columns:1fr;padding:12px}.market-left{order:2}.market-center{order:1}.market-right{order:3;grid-column:auto;grid-template-columns:1fr}.market-hero{min-height:245px;padding:24px 18px}.market-hero h1,.market-hero h1 span{font-size:25px}.product-grid{grid-template-columns:repeat(2,1fr)}.boutique-grid{grid-template-columns:1fr}.categories-card{display:none}}
      `}</style>
    </AppShell>
  )
}
