'use client'
import {useEffect,useState} from 'react'
import {supabase} from '../../lib/supabase'

export default function AdminPage(){
 const [loading,setLoading]=useState(true),[admin,setAdmin]=useState(false),[shops,setShops]=useState([]),[busy,setBusy]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState('')
 async function load(){
  setLoading(true);setError('')
  const {data:{user},error:e}=await supabase.auth.getUser()
  if(e||user?.app_metadata?.role!=='admin'){setAdmin(false);setLoading(false);return}
  setAdmin(true)
  const q=await supabase.from('boutiques').select('id,name,plan,is_live,owner_supervised,created_at').order('created_at',{ascending:false})
  if(q.error)setError(q.error.message);else setShops(q.data||[])
  setLoading(false)
 }
 useEffect(()=>{load()},[])
 async function freeAccess(shop,enabled){
  setBusy(shop.id);setMessage('');setError('')
  const {error:e}=await supabase.rpc('admin_set_boutique_owner_mode',{p_boutique_id:shop.id,p_owner_supervised:enabled})
  if(e)setError(e.message)
  else{setMessage(enabled?'تم تفعيل المجانية حتى إشعار لاحق.':'تم إنهاء المجانية.');await load()}
  setBusy('')
 }
 if(loading)return <main style={page}><section style={card}>Chargement…</section></main>
 if(!admin)return <main style={page}><section style={card}><h1>WakhReek Admin</h1><p>Accès administrateur uniquement.</p><a href="/">Retour</a></section></main>
 return <main style={page}><div style={wrap}>
  <header style={head}><div><h1 style={{margin:0}}>WakhReek Admin</h1><p style={muted}>الإدارة والإشراف العام</p></div><button style={button('#0066ff')} onClick={load}>Actualiser</button></header>
  <section style={policy}><strong>صلاحية Admin:</strong> المجانية = تفعيل البوتيك بدون أداء <b>حتى إشعار لاحق</b>. باقي الآليات مخصصة للإشراف العام والمتابعة، وليست شروطاً للتفعيل المجاني.</section>
  <nav style={nav}><a href="/admin/analytics">📊 الإحصائيات</a><a href="/admin/security">🛡️ الأمن</a><a href="/admin/services">🧰 الخدمات</a><a href="/admin/ai">✨ AI</a><a href="/admin/assistant">🤖 Assistant</a></nav>
  {message&&<div style={ok}>{message}</div>}{error&&<div style={bad}>{error}</div>}
  <section style={card}><h2 style={{marginTop:0}}>الإشراف على البوتيكات <small>({shops.length})</small></h2>
   <div style={{display:'grid',gap:12}}>{shops.map(s=><article key={s.id} style={row}>
    <div><strong style={{fontSize:18}}>{s.name}</strong><div style={muted}>{s.plan||'—'} · {s.is_live?'🟢 مفعلة':'⚪ غير مفعلة'} · {s.owner_supervised?'🎁 مجانية حتى إشعار لاحق':'💳 نظام عادي'}</div></div>
    <button disabled={busy===s.id} style={button(s.owner_supervised?'#b54708':'#12b76a')} onClick={()=>freeAccess(s,!s.owner_supervised)}>{busy===s.id?'…':s.owner_supervised?'إنهاء المجانية':'🎁 تفعيل مجاني حتى إشعار لاحق'}</button>
   </article>)}</div>
  </section>
 </div></main>
}
const page={minHeight:'100vh',background:'#f4f7fb',padding:24,fontFamily:'Arial,sans-serif',color:'#172033'}
const wrap={maxWidth:1180,margin:'0 auto'}
const card={background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 18px #1028400f'}
const head={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:14}
const muted={margin:'6px 0',color:'#667085'}
const policy={...card,borderLeft:'5px solid #0066ff',marginBottom:14}
const nav={...card,display:'flex',gap:16,flexWrap:'wrap',marginBottom:14}
const row={border:'1px solid #eaecf0',borderRadius:12,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}
const ok={...card,borderLeft:'5px solid #12b76a',marginBottom:14}
const bad={...card,borderLeft:'5px solid #d92d20',color:'#b42318',marginBottom:14}
const button=background=>({border:0,borderRadius:9,padding:'10px 13px',background,color:'#fff',fontWeight:800,cursor:'pointer'})
