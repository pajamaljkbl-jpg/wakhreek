'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '../../../../components/AppShell'
import { supabase } from '../../../../lib/supabase'

function money(p) {
  const amount = p.price_amount ?? p.price_cfa ?? 0
  const currency = p.currency_code || 'XOF'
  return `${Number(amount).toLocaleString('fr-FR')} ${currency === 'XOF' ? 'CFA' : currency}`
}

export default function BoutiquePage() {
  const { id } = useParams()
  const router = useRouter()
  const [boutique, setBoutique] = useState(null)
  const [products, setProducts] = useState([])
  const [user, setUser] = useState(null)
  const [inquiries, setInquiries] = useState([])
  const [message, setMessage] = useState('')
  const [replyDrafts, setReplyDrafts] = useState({})
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  const isOwner = !!user && boutique?.user_id === user.id

  async function load() {
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    const currentUser = auth?.user || null
    setUser(currentUser)
    const { data: b } = await supabase.from('boutiques').select('id,user_id,name,description,type,plan,product_count_limit,has_ads,has_ai_agent,rating,is_live,logo_url,country_id,city_id').eq('id', id).eq('is_live', true).maybeSingle()
    setBoutique(b || null)
    if (b) {
      const { data: p } = await supabase.from('products').select('id,name,price_cfa,original_price_cfa,category,image_url,stock,price_amount,original_price_amount,currency_code').eq('boutique_id', b.id).order('created_at', { ascending: false })
      setProducts(p || [])
      if (currentUser) {
        const { data: q } = await supabase.from('market_boutique_inquiries').select('id,customer_id,message,reply,status,created_at,replied_at').eq('boutique_id', b.id).order('created_at', { ascending: false })
        setInquiries(q || [])
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function sendInquiry(e) {
    e.preventDefault(); setNotice('')
    if (!user) return setNotice('Connectez-vous pour contacter cette boutique.')
    if (!message.trim()) return
    const { error } = await supabase.from('market_boutique_inquiries').insert({ boutique_id: boutique.id, customer_id: user.id, message: message.trim() })
    if (error) return setNotice(error.message)
    setMessage(''); setNotice('Votre message a été envoyé à la boutique.'); await load()
  }

  async function reply(inquiry) {
    const text = (replyDrafts[inquiry.id] || '').trim()
    if (!text) return
    const { error } = await supabase.from('market_boutique_inquiries').update({ reply: text, status: 'replied', replied_at: new Date().toISOString() }).eq('id', inquiry.id)
    if (error) return setNotice(error.message)
    setReplyDrafts(v => ({ ...v, [inquiry.id]: '' })); setNotice('Réponse envoyée au client.'); await load()
  }

  const myInquiries = useMemo(() => isOwner ? inquiries : inquiries.filter(q => q.customer_id === user?.id), [inquiries, isOwner, user?.id])

  if (loading) return <AppShell><main className="shop"><div className="card">Chargement de la boutique...</div></main></AppShell>
  if (!boutique) return <AppShell><main className="shop"><div className="card"><h2>Boutique indisponible</h2><p>Cette boutique n’est pas encore active ou n’est plus disponible.</p><button onClick={()=>router.push('/market')}>Retour au Marché</button></div></main></AppShell>

  return <AppShell><main className="shop">
    <button className="back" onClick={()=>router.push('/market')}>← Marché</button>
    <section className="hero"><div className="logo">{boutique.logo_url ? <img src={boutique.logo_url} alt={boutique.name}/> : '🏪'}</div><div><small>BOUTIQUE WAKHREEK ACTIVE</small><h1>{boutique.name}</h1><p>{boutique.description || 'Bienvenue dans notre boutique WakhReek.'}</p><div className="badges"><span>✓ Validée</span><span>⭐ {Number(boutique.rating || 0).toFixed(1)}</span><span>{boutique.plan === 'company_unlimited' ? 'Entreprise' : boutique.plan === 'pro_45' ? '45 produits' : '15 produits'}</span>{boutique.has_ai_agent && <span>🤖 IA</span>}{boutique.has_ads && <span>📣 Publicité</span>}</div></div></section>

    <section className="card"><h2>Produits</h2>{products.length === 0 ? <div className="empty">Cette boutique est ouverte. Le vendeur n’a pas encore ajouté de produits.</div> : <div className="products">{products.map(p=><article key={p.id}><div className="photo">{p.image_url?<img src={p.image_url} alt={p.name}/>:'📦'}</div><h3>{p.name}</h3><small>{p.category}</small><strong>{money(p)}</strong>{p.stock != null && <em>{p.stock > 0 ? `Stock: ${p.stock}` : 'Rupture de stock'}</em>}</article>)}</div>}</section>

    <section className="card contact"><h2>{isOwner ? 'Demandes des clients' : 'Contacter la boutique'}</h2>
      {!isOwner && <form onSubmit={sendInquiry}><textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={2000} placeholder="Posez une question sur un produit, le prix, la livraison..."/><button>Envoyer à la boutique</button></form>}
      {notice && <p className="notice">{notice}</p>}
      {myInquiries.length > 0 && <div className="threads">{myInquiries.map(q=><article key={q.id}><div className="question"><b>{isOwner ? 'Client' : 'Vous'}</b><p>{q.message}</p><small>{new Date(q.created_at).toLocaleString('fr-FR')}</small></div>{q.reply && <div className="answer"><b>Réponse boutique</b><p>{q.reply}</p></div>}{isOwner && q.status !== 'closed' && <div className="reply"><textarea value={replyDrafts[q.id]||''} onChange={e=>setReplyDrafts(v=>({...v,[q.id]:e.target.value}))} placeholder="Répondre au client..."/><button onClick={()=>reply(q)}>Répondre</button></div>}</article>)}</div>}
    </section>
  </main><style jsx>{`
    .shop{max-width:1180px;margin:0 auto;padding:22px;color:#172033}.back,.card button{border:0;border-radius:9px;padding:10px 14px;background:#0875e8;color:#fff;font-weight:800;cursor:pointer}.back{margin-bottom:15px}.hero,.card{background:#fff;border:1px solid #e1e6ee;border-radius:16px;padding:22px;margin-bottom:18px}.hero{display:flex;gap:20px;align-items:center;background:linear-gradient(135deg,#075dcc,#087ff0);color:#fff}.logo{width:110px;height:110px;flex:0 0 110px;border-radius:22px;background:#fff;display:grid;place-items:center;font-size:55px;overflow:hidden}.logo img,.photo img{width:100%;height:100%;object-fit:cover}.hero small{font-weight:900;color:#d9ecff}.hero h1{font-size:32px;margin:5px 0}.hero p{max-width:700px;line-height:1.6}.badges{display:flex;gap:8px;flex-wrap:wrap}.badges span{background:rgba(255,255,255,.17);border-radius:20px;padding:7px 10px;font-size:12px}.card h2{color:#075dcc;margin-top:0}.products{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.products article{border:1px solid #e1e6ee;border-radius:12px;overflow:hidden;padding-bottom:12px}.photo{height:160px;background:#f4f6f8;display:grid;place-items:center;font-size:55px}.products h3,.products small,.products strong,.products em{margin-left:12px;margin-right:12px}.products h3{font-size:15px;margin-bottom:5px}.products small{display:block;color:#667085}.products strong{display:block;color:#075dcc;margin-top:10px}.products em{display:block;font-style:normal;font-size:11px;color:#667085;margin-top:5px}.empty{padding:20px;background:#f8fafc;border-radius:10px;color:#667085}.contact form,.reply{display:grid;gap:10px}.contact textarea{min-height:90px;border:1px solid #ccd5e2;border-radius:10px;padding:12px;font:inherit;resize:vertical}.notice{background:#eef6ff;color:#075dcc;padding:11px;border-radius:9px}.threads{display:grid;gap:12px;margin-top:16px}.threads>article{border:1px solid #e1e6ee;border-radius:12px;padding:14px}.question,.answer{padding:10px;border-radius:9px}.question{background:#f8fafc}.answer{background:#eef9f1;margin-top:8px}.question p,.answer p{margin:6px 0;white-space:pre-wrap}.question small{color:#667085}.reply{margin-top:10px}.reply textarea{min-height:65px}@media(max-width:800px){.shop{padding:12px}.hero{align-items:flex-start}.logo{width:75px;height:75px;flex-basis:75px}.hero h1{font-size:23px}.products{grid-template-columns:repeat(2,1fr)}}@media(max-width:480px){.hero{display:block}.logo{margin-bottom:12px}.products{grid-template-columns:1fr}}
  `}</style></AppShell>
}