'use client'
import {useEffect,useState} from 'react'
import {supabase} from '../../lib/supabase'

export default function AdminPage(){
 const [state,setState]=useState({loading:true,admin:false,boutiques:[],error:'',notice:''})
 const [busy,setBusy]=useState('')
 async function load(){
  setState(s=>({...s,loading:true,error:''}))
  const {data:{user},error:authError}=await supabase.auth.getUser()
  if(authError||user?.app_metadata?.role!=='admin'){setState({loading:false,admin:false,boutiques:[],error:'',notice:''});return}
  const {data,error}=await supabase.from('boutiques').select('id,name,plan,is_live,owner_supervised,legal_verification_status,created_at').order('created_at',{ascending:false})
  setState(s=>({...s,loading:false,admin:true,boutiques:data||[],error:error?.message||''}))
 }
 useEffect(()=>{load()},[])
 async function owner(id,enabled){
  setBusy(id);setState(s=>({...s,error:'',notice:''}))
  const {error}=await supabase.rpc('admin_set_boutique_owner_mode',{p_boutique_id:id,p_owner_supervised:enabled})
  if(error)setState(s=>({...s,error:error.message}))
  else{await load();setState(s=>({...s,notice:enabled?'صلاحية مجانية مفعلة — بدون أداء.':'تم إلغاء الصلاحية المجانية.'}))}
  setBusy('')
 }
 async function live(id,enabled){
  setBusy(id);setState(s=>({...s,error:'',notice:''}))
  const {error}=await supabase.from('boutiques').update({is_live:enabled}).eq('id',id)
  if(error)setState(s=>({...s,error:error.message}))
  else{await load();setState(s=>({...s,notice:enabled?'تم تفعيل البوتيك.':'تم إيقاف البوتيك.'}))}
  setBusy('')
 }
 if(state.loading)return <main style={page}><div style={card}>Chargement Admin…</div></main>
 if(!state.admin)return <main style={page}><div style={card}><h1>Administration protégée</h1><p>Accès réservé à l’administrateur WakhReek.</p><a href="/">Retour</a></div></main>
 return <main style={page}><div style={{maxWidth:1200,margin:'0 auto'}}>
  <header style={header}><div><h1 style={{margin:0}}>WakhReek Admin</h1><p style={{margin:'6px 0',color:'#667085'}}>تفويض شامل لإدارة البوتيكات</p></div><button onClick={load} style={btn('#0066ff')}>Actualiser</button></header>
  <nav style={nav}><a href="/admin/analytics">📊 Statistiques</a><a href="/admin/security">🛡️ Sécurité</a><a href="/admin/services">🧰 Services</a><a href="/admin/ai">✨ AI Studio</a><a href="/admin/assistant">🤖 WakhReek AI</a></nav>
  <div style={info}><b>النظام:</b> العقد يبقى. الوثائق ليست شرطاً. Admin يستطيع التفعيل/الإيقاف ومنح أو إلغاء المجانية بدون أداء.</div>
  {state.notice&&<div style={{...card,borderLeft:'5px solid #12b76a',marginBottom:14}}>{state.notice}</div>}
  {state.error&&<div style={{...card,borderLeft:'5px solid #d92d20',color:'#b42318',marginBottom:14}}>{state.error}</div>}
  <section style={card}><h2>Boutiques ({state.boutiques.length})</h2>
   {state.boutiques.length===0?<p>Aucune boutique.</p>:<div style={{display:'grid',gap:12}}>{state.boutiques.map(b=><article key={b.id} style={shop}>
    <div><strong style={{fontSize:18}}>{b.name}</strong><div style={{color:'#667085',marginTop:5}}>{b.plan||'—'} • {b.is_live?'🟢 Active':'⚪ Inactive'} {b.owner_supervised?'• 🎁 Gratuite':''}</div></div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
     <button disabled={busy===b.id} onClick={()=>owner(b.id,!b.owner_supervised)} style={btn(b.owner_supervised?'#b54708':'#344054')}>{b.owner_supervised?'إلغاء المجانية':'🎁 منح المجانية'}</button>
     <button disabled={busy===b.id} onClick={()=>live(b.id,!b.is_live)} style={btn(b.is_live?'#667085':'#12b76a')}>{b.is_live?'إيقاف':'تفعيل'}</button>
    </div>
   </article>)}</div>}
  </section>
 </div></main>
}
const page={minHeight:'100vh',background:'#f4f7fb',padding:24,fontFamily:'Arial,sans-serif',color:'#172033'}
const card={background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 18px #1028400f'}
const header={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:14}
const nav={display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}
const info={...card,marginBottom:14,borderLeft:'5px solid #0066ff'}
const shop={border:'1px solid #eaecf0',borderRadius:12,padding:16,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}
const btn=background=>({border:0,borderRadius:9,padding:'10px 13px',background,color:'#fff',fontWeight:800,cursor:'pointer'})
