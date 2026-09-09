'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '../../../components/AppShell'
import { supabase } from '../../../lib/supabase'

export default function MyBoutiquePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '' })
  const [photo, setPhoto] = useState(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadData() {
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData?.user
    if (!currentUser) {
      router.push('/')
      return
    }

    setUser(currentUser)
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setShop(boutique || null)
    if (!boutique) return

    const [productsResult, inquiriesResult] = await Promise.all([
      supabase.from('products').select('*').eq('boutique_id', boutique.id).order('created_at', { ascending: false }),
      supabase.from('market_boutique_inquiries').select('*').eq('boutique_id', boutique.id).order('created_at', { ascending: false })
    ])

    setProducts(productsResult.data || [])
    setInquiries(inquiriesResult.data || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  async function publishProduct(event) {
    event.preventDefault()
    setNotice('')

    if (!shop?.is_live) {
      setNotice('La boutique doit être active pour publier un produit.')
      return
    }

    if (shop.product_count_limit != null && products.length >= shop.product_count_limit) {
      setNotice(`Limite du plan atteinte : ${shop.product_count_limit} produits.`)
      return
    }

    const price = Number(form.price)
    if (!form.name.trim() || !form.category.trim() || !Number.isFinite(price) || price < 0) {
      setNotice('Nom, catégorie et prix valides sont obligatoires.')
      return
    }

    if (!photo) {
      setNotice('Choisissez une photo du produit.')
      return
    }

    if (!photo.type.startsWith('image/')) {
      setNotice('Le fichier choisi doit être une image.')
      return
    }

    if (photo.size > 5 * 1024 * 1024) {
      setNotice('La photo ne doit pas dépasser 5 Mo.')
      return
    }

    setBusy(true)
    try {
      const rawExt = photo.name.includes('.') ? photo.name.split('.').pop() : 'jpg'
      const ext = (rawExt || 'jpg').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
      const storagePath = `${user.id}/${shop.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('wakhreek-images')
        .upload(storagePath, photo, { cacheControl: '3600', upsert: false, contentType: photo.type })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from('wakhreek-images').getPublicUrl(storagePath)
      const imageUrl = publicData?.publicUrl
      if (!imageUrl) throw new Error('Impossible de créer le lien de la photo.')

      const payload = {
        boutique_id: shop.id,
        name: form.name.trim(),
        category: form.category.trim(),
        price_cfa: Math.round(price),
        price_amount: price,
        currency_code: 'XOF',
        image_url: imageUrl,
        stock: form.stock === '' ? null : Number(form.stock)
      }

      const { error: insertError } = await supabase.from('products').insert(payload)
      if (insertError) {
        await supabase.storage.from('wakhreek-images').remove([storagePath])
        throw insertError
      }

      setForm({ name: '', category: '', price: '', stock: '' })
      setPhoto(null)
      const input = document.getElementById('product-photo')
      if (input) input.value = ''
      setNotice('Produit publié avec sa photo.')
      await loadData()
    } catch (error) {
      setNotice(error?.message || 'Erreur pendant la publication du produit.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteProduct(product) {
    setNotice('')
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('boutique_id', shop.id)

    if (error) {
      setNotice(error.message)
      return
    }

    await loadData()
  }

  async function replyToClient(inquiry) {
    const text = window.prompt('Réponse au client :')
    if (!text?.trim()) return

    const { error } = await supabase
      .from('market_boutique_inquiries')
      .update({ reply: text.trim(), status: 'replied', replied_at: new Date().toISOString() })
      .eq('id', inquiry.id)

    if (error) {
      setNotice(error.message)
      return
    }

    await loadData()
  }

  if (!shop) {
    return (
      <AppShell>
        <main className="wrap">
          <section className="card">
            <h2>Ma boutique</h2>
            <p>Aucune boutique trouvée.</p>
            <button onClick={() => router.push('/market/create')}>Créer une boutique</button>
          </section>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className="wrap">
        <header className="top">
          <div>
            <small>ESPACE VENDEUR WAKHREEK</small>
            <h1>{shop.name}</h1>
            <p>{shop.is_live ? '🟢 Boutique active et visible' : '🟠 En attente de validation / activation'}</p>
          </div>
          <div className="actions">
            <button onClick={() => router.push(`/market/boutique/${shop.id}`)} disabled={!shop.is_live}>Voir ma boutique</button>
            <button onClick={() => router.push('/market')}>Marché</button>
          </div>
        </header>

        <div className="stats">
          <div><b>{products.length}</b><span>Produits publiés</span></div>
          <div><b>{shop.product_count_limit ?? '∞'}</b><span>Limite du plan</span></div>
          <div><b>{inquiries.filter((item) => item.status === 'new').length}</b><span>Nouveaux clients</span></div>
          <div><b>{shop.has_ai_agent ? 'Oui' : 'Non'}</b><span>Assistant IA</span></div>
        </div>

        <section className="card">
          <h2>Ajouter un produit</h2>
          <p className="rule">Ajoutez la photo directement depuis votre téléphone ou ordinateur.</p>
          <form className="form" onSubmit={publishProduct}>
            <input placeholder="Nom du produit" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input type="number" min="0" step="1" placeholder="Prix" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input type="number" min="0" step="1" placeholder="Stock (facultatif)" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <label className="upload">
              <strong>📷 Télécharger la photo du produit</strong>
              <input id="product-photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              <small>{photo ? `${photo.name} — ${(photo.size / 1024 / 1024).toFixed(1)} Mo` : 'JPG, PNG ou WEBP — maximum 5 Mo'}</small>
            </label>
            <button type="submit" disabled={busy}>{busy ? 'Publication...' : 'Publier le produit'}</button>
          </form>
          {notice && <p className="notice">{notice}</p>}
        </section>

        <section className="card">
          <h2>Mes produits</h2>
          {!products.length ? <p>Aucun produit.</p> : (
            <div className="products">
              {products.map((product) => (
                <article key={product.id}>
                  {product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="ph">📦</div>}
                  <div className="productText">
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                    <b>{Number(product.price_amount ?? product.price_cfa).toLocaleString('fr-FR')} {product.currency_code === 'XOF' || !product.currency_code ? 'CFA' : product.currency_code}</b>
                    <small>{product.stock == null ? 'Stock non déclaré' : `Stock : ${product.stock}`}</small>
                    <button className="danger" onClick={() => deleteProduct(product)}>Supprimer</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>Clients</h2>
          {!inquiries.length ? <p>Aucune demande client.</p> : inquiries.map((inquiry) => (
            <article className="message" key={inquiry.id}>
              <p>{inquiry.message}</p>
              {inquiry.reply ? <div className="answer">Votre réponse : {inquiry.reply}</div> : <button onClick={() => replyToClient(inquiry)}>Répondre</button>}
            </article>
          ))}
        </section>
      </main>

      <style jsx>{`
        .wrap{max-width:1180px;margin:auto;padding:22px;color:#172033}
        .top{background:linear-gradient(135deg,#075dcc,#087ff0);color:white;border-radius:16px;padding:24px;display:flex;justify-content:space-between;gap:20px;align-items:center}
        .top h1{margin:4px 0}.actions{display:flex;gap:8px;flex-wrap:wrap}
        button{border:0;border-radius:9px;padding:10px 14px;background:#0875e8;color:white;font-weight:800;cursor:pointer}
        button:disabled{opacity:.55;cursor:not-allowed}.top button{background:white;color:#075dcc}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
        .stats div,.card{background:white;border:1px solid #e1e6ee;border-radius:14px;padding:18px}
        .stats b{display:block;font-size:24px;color:#075dcc}.stats span{font-size:12px;color:#667085}
        .card{margin-bottom:16px}.card h2{margin-top:0;color:#075dcc}.rule{background:#f7f9fc;padding:10px;border-radius:8px;color:#667085}
        .form{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.form>input{padding:11px;border:1px solid #ccd5e2;border-radius:9px}
        .upload{grid-column:1/-1;border:2px dashed #87aee1;border-radius:12px;padding:16px;display:grid;gap:9px;background:#f7fbff}
        .upload input{display:block}.upload small{color:#667085}.notice{background:#eef6ff;color:#075dcc;padding:10px;border-radius:8px}
        .products{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.products article{display:flex;border:1px solid #e1e6ee;border-radius:12px;overflow:hidden}
        .products img,.ph{width:130px;height:130px;object-fit:cover;display:grid;place-items:center;background:#f4f6f8;font-size:42px}
        .productText{padding:10px;flex:1}.productText h3{margin:0}.productText p,.productText small{display:block;color:#667085;margin:5px 0}
        .danger{background:#d92d20;padding:6px 9px;margin-top:5px}.message{border:1px solid #e1e6ee;border-radius:10px;padding:12px;margin-top:10px}.answer{background:#eef9f1;padding:9px;border-radius:8px}
        @media(max-width:700px){.wrap{padding:12px}.top{display:block}.actions{margin-top:12px}.stats{grid-template-columns:repeat(2,1fr)}.form,.products{grid-template-columns:1fr}.upload{grid-column:auto}}
      `}</style>
    </AppShell>
  )
}
