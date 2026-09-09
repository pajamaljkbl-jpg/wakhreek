'use client'

import {useEffect,useState} from 'react'
import {usePathname,useRouter} from 'next/navigation'
import {supabase} from '../lib/supabase'

export default function CommunicationTvBand(){
  const pathname=usePathname()
  const router=useRouter()
  const [shops,setShops]=useState([])
  const [index,setIndex]=useState(0)
  const active=pathname==='/communication'

  useEffect(()=>{
    if(!active)return
    let cancelled=false
    async function load(){
      const {data}=await supabase.from('boutiques').select('id,name,description,logo_url').eq('is_live',true).order('created_at',{ascending:false}).limit(20)
      if(!cancelled)setShops(data||[])
    }
    load()
    const oldPadding=document.body.style.paddingBottom
    document.body.style.paddingBottom='92px'
    return()=>{cancelled=true;document.body.style.paddingBottom=oldPadding}
  },[active])

  useEffect(()=>{
    if(!active||shops.length<2)return
    const timer=setInterval(()=>setIndex(i=>(i+1)%shops.length),4500)
    return()=>clearInterval(timer)
  },[active,shops.length])

  if(!active)return null
  const shop=shops[index]||null

  return <aside className="tvBand" aria-label="WakhReek TV boutiques">
    <button className="tvLabel" onClick={()=>router.push('/tv')}><b>▶ WakhReek TV</b><span>Découvrir</span></button>
    <div className="track">
      {shop?<button className="shop" onClick={()=>router.push(`/market/boutique/${shop.id}`)}>
        {shop.logo_url?<img src={shop.logo_url} alt={shop.name}/>:<span className="logo">wR</span>}
        <span className="copy"><b>{shop.name}</b><small>{shop.description||'Boutique WakhReek • Voir le magasin'}</small></span>
        <span className="cta">Voir →</span>
      </button>:<div className="waiting">Les boutiques WakhReek apparaîtront ici.</div>}
    </div>
    <style jsx>{`
      .tvBand{position:fixed;left:0;right:0;bottom:0;z-index:70;min-height:78px;background:#090909;color:#fff;border-top:3px solid #ff9818;display:grid;grid-template-columns:150px 1fr;gap:8px;padding:7px 12px;box-shadow:0 -8px 25px rgba(0,0,0,.2)}
      button{font:inherit}.tvLabel{border:0;background:#101820;color:#fff;border-radius:10px;padding:7px 11px;display:grid;align-content:center;text-align:left;cursor:pointer}.tvLabel b{color:#ff9b22}.tvLabel span{font-size:11px;opacity:.8}.track{min-width:0}.shop{width:100%;height:62px;border:0;background:#fff;color:#172033;border-radius:11px;padding:6px 9px;display:grid;grid-template-columns:50px 1fr auto;gap:10px;align-items:center;text-align:left;cursor:pointer;animation:fade .35s ease}.shop img,.logo{width:50px;height:50px;border-radius:9px;object-fit:cover}.logo{display:grid;place-items:center;background:#0875e8;color:#fff;font-weight:900}.copy{min-width:0;display:grid}.copy b,.copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.copy small{color:#667085}.cta{font-weight:900;color:#0875e8;white-space:nowrap}.waiting{height:62px;border-radius:11px;background:#161616;display:grid;place-items:center;color:#c9ced6;font-size:13px}@keyframes fade{from{opacity:.35;transform:translateX(8px)}to{opacity:1;transform:none}}
      @media(max-width:650px){.tvBand{grid-template-columns:94px 1fr;padding:6px;min-height:72px}.tvLabel{padding:6px;font-size:11px}.shop{height:58px;grid-template-columns:44px 1fr auto;gap:7px}.shop img,.logo{width:44px;height:44px}.copy b{font-size:12px}.copy small{font-size:10px}.cta{font-size:11px}}
    `}</style>
  </aside>
}
