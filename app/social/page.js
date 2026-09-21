'use client'

import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
import AppShell from '../../components/AppShell'
import {supabase} from '../../lib/supabase'

export default function SocialPage(){
 const router=useRouter()
 const [ads,setAds]=useState([]),[shops,setShops]=useState([]),[loading,setLoading]=useState(true),[gate,setGate]=useState(false)
 useEffect(()=>{load()},[])
 async function load(){
  setLoading(true)
  const now=new Date().toISOString()
  const [{data:a},{data:b}]=await Promise.all([
   supabase.from('market_tv_ads').select('id,boutique_id,title,description,media_type,media_url,created_at').eq('status','active').or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`).order('created_at',{ascending:false}).limit(30),
   supabase.from('boutiques').select('id,name,description,logo_url').eq('is_live',true).order('created_at',{ascending:false}).limit(12)
  ])
  setAds(a||[]);setShops(b||[]);setLoading(false)
 }
 const locked=()=>setGate(true)
 return <AppShell><main className="social">
  <header className="head"><div><span className="brand">WakhReek Social</span><h1>Découvrez ce qui se passe sur WakhReek</h1><p>Personnes • Vidéos • Boutiques • Produits</p></div><button onClick={locked}>Rejoindre WakhReek</button></header>
  <section className="welcome"><div><b>Bienvenue sur WakhReek Social</b><p>Regardez un aperçu public. Pour interagir, communiquer et découvrir davantage, rejoignez WakhReek.</p></div><button onClick={locked}>Découvrir plus</button></section>
  {loading?<div className="empty">Chargement…</div>:<>
   {ads.length>0&&<section className="feed">{ads.slice(0,5).map(ad=><article className="post" key={ad.id}>
    <div className="posttop"><div className="avatar">WR</div><div><b>WakhReek</b><small>Publication sponsorisée</small></div></div>
    {ad.description&&<p className="caption" data-user-content data-no-translate>{ad.description}</p>}
    {ad.media_type==='video'?<video src={ad.media_url} controls playsInline preload="metadata"/>:<img src={ad.media_url} alt={ad.title}/>}
    <div className="body"><h2 data-user-content data-no-translate>{ad.title}</h2><div className="actions"><button onClick={locked}>♡ J’aime</button><button onClick={locked}>💬 Commenter</button><button onClick={locked}>↗ Partager</button></div>{ad.boutique_id&&<button className="shopbtn" onClick={locked}>Voir la boutique</button>}</div>
   </article>)}</section>}
   {ads.length===0&&<section className="empty"><div className="play">▶</div><h2>WakhReek Social arrive</h2><p>Les premières publications apparaîtront ici.</p></section>}
   {shops.length>0&&<section className="shops"><h2>Boutiques à découvrir</h2><div className="shopgrid">{shops.slice(0,6).map(s=><button className="shop" key={s.id} onClick={locked}>{s.logo_url?<img src={s.logo_url} alt={s.name}/>:<span className="placeholder">WR</span>}<span><b data-user-content data-no-translate>{s.name}</b><small>Voir sur WakhReek</small></span></button>)}</div></section>}
  </>}
  <section className="locked"><span>🔒</span><h2>La suite est dans WakhReek</h2><p>Rejoignez la communauté pour publier, commenter, suivre, communiquer et accéder au Market.</p><button onClick={locked}>Entrer dans WakhReek</button></section>
  {gate&&<div className="overlay" onClick={()=>setGate(false)}><div className="gate" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setGate(false)}>×</button><div className="logo">W</div><h2>Entrez dans WakhReek</h2><p>Installez l’application puis créez votre compte pour profiter de WakhReek Social, Communication et Market.</p><video src="/Ma%20vid%C3%A9o-80.mp4" controls playsInline preload="metadata"/><button className="download" onClick={()=>router.push('/download')}>Télécharger WakhReek</button><button className="account" onClick={()=>router.push('/')}>Créer un compte</button></div></div>}
 </main><style jsx>{`
 .social{max-width:760px;margin:auto;padding:14px 14px 50px;color:#172033}.head{background:linear-gradient(135deg,#071a35,#0b65c8);color:#fff;border-radius:22px;padding:26px;display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-weight:900;color:#ffad3d}.head h1{margin:7px 0;font-size:30px}.head p{margin:0;opacity:.85}.head button,.welcome button,.locked button{border:0;border-radius:12px;background:#ff9818;color:#fff;font-weight:900;padding:12px 16px;cursor:pointer}.welcome{margin:15px 0;background:#fff;border:1px solid #dce5ef;border-radius:16px;padding:16px;display:flex;align-items:center;justify-content:space-between;gap:15px}.welcome p{margin:5px 0 0;color:#667085}.feed{display:grid;gap:16px}.post{background:#fff;border:1px solid #dce5ef;border-radius:18px;overflow:hidden;box-shadow:0 7px 24px rgba(20,45,80,.07)}.posttop{display:flex;gap:10px;align-items:center;padding:14px}.avatar,.logo{display:grid;place-items:center;background:#0b7fe5;color:#fff;font-weight:900}.avatar{width:42px;height:42px;border-radius:50%}.posttop div:last-child{display:grid}.posttop small{color:#667085}.caption{padding:0 14px;margin:0 0 12px}.post>video,.post>img{width:100%;max-height:520px;object-fit:cover;background:#050505}.body{padding:14px}.body h2{margin:0 0 12px}.actions{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #edf1f5;border-bottom:1px solid #edf1f5}.actions button{border:0;background:#fff;padding:12px 4px;font-weight:700;cursor:pointer;color:#4b5565}.shopbtn{margin-top:12px;width:100%;border:0;border-radius:11px;padding:11px;background:#0b7fe5;color:#fff;font-weight:800}.shops{margin-top:22px}.shopgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.shop{border:1px solid #dce5ef;background:#fff;border-radius:14px;padding:10px;display:flex;align-items:center;gap:10px;text-align:left}.shop img,.placeholder{width:50px;height:50px;border-radius:12px;object-fit:cover}.placeholder{display:grid;place-items:center;background:#0b7fe5;color:#fff;font-weight:900}.shop>span:last-child{display:grid}.shop small{color:#667085}.locked,.empty{text-align:center;margin-top:18px;padding:34px 20px;background:#fff;border:1px dashed #bdcad8;border-radius:18px}.locked>span{font-size:34px}.locked h2{margin:8px}.locked p,.empty p{color:#667085}.play{margin:auto;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#0b7fe5;color:#fff}.overlay{position:fixed;inset:0;background:rgba(4,12,24,.72);z-index:9999;display:grid;place-items:center;padding:16px}.gate{width:min(480px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;padding:24px;position:relative;text-align:center}.close{position:absolute;right:12px;top:9px;border:0;background:transparent;font-size:28px;cursor:pointer}.logo{width:54px;height:54px;border-radius:15px;margin:auto;font-size:28px}.gate h2{margin:10px 0 6px}.gate p{color:#667085}.gate video{width:100%;border-radius:13px;background:#000;max-height:280px}.download,.account{width:100%;border:0;border-radius:12px;padding:13px;font-weight:900;cursor:pointer;margin-top:10px}.download{background:#ff9818;color:#fff}.account{background:#0b7fe5;color:#fff}
 @media(max-width:650px){.social{padding:8px}.head{display:block;padding:20px}.head h1{font-size:25px}.head button{margin-top:15px}.welcome{display:block}.welcome button{margin-top:12px}.shopgrid{grid-template-columns:1fr}.actions button{font-size:12px}}
 `}</style></AppShell>
}
