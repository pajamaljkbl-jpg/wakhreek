'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {supabase} from '../../../lib/supabase'

export default function AdminAssistant(){
 const[data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true)
 async function load(){setLoading(true);setError('');const{data:d,error:e}=await supabase.rpc('admin_assistant_snapshot');if(e)setError(e.message);else setData(d);setLoading(false)}
 useEffect(()=>{load()},[])
 if(loading)return <main style={page}><div style={card}>WakhReek AI — Analyse en cours…</div></main>
 if(error)return <main style={page}><div style={card}><h1>WakhReek AI</h1><p>{error}</p><Link href="/admin">← Admin</Link></div></main>
 const alerts=[]
 if(data.legal_pending)alerts.push(`${data.legal_pending} boutique(s) attendent une vérification juridique.`)
 if(data.payments_pending)alerts.push(`${data.payments_pending} paiement(s) sont en attente.`)
 if(!alerts.length)alerts.push('Aucune urgence administrative détectée actuellement.')
 return <main style={page}><div style={{maxWidth:1100,margin:'0 auto'}}>
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><h1>🤖 WakhReek AI — Assistant Admin</h1><p>Lecture intelligente des données de la plateforme. Les décisions sensibles restent à l’administrateur.</p></div><Link href="/admin">← Admin</Link></header>
  <section style={grid}><Stat t="Utilisateurs" v={data.users_total}/><Stat t="Nouveaux aujourd’hui" v={data.users_today}/><Stat t="Visites" v={data.visits}/><Stat t="Téléchargements APK" v={data.apk_downloads}/><Stat t="Boutiques" v={data.boutiques_total}/><Stat t="Boutiques actives" v={data.boutiques_live}/></section>
  <section style={card}><h2>🧠 Priorités recommandées</h2>{alerts.map(x=><p key={x}>• {x}</p>)}<p>Vérifications juridiques: <b>{data.legal_pending}</b> — Paiements en attente: <b>{data.payments_pending}</b></p></section>
  <section style={{...card,marginTop:16}}><h2>🌍 Activité par pays</h2>{data.countries?.length?data.countries.map(x=><div key={x.country} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #eee'}}><span>{x.country}</span><b>{x.total}</b></div>):<p>Pas encore de données de pays.</p>}</section>
  <button onClick={load} style={btn}>Actualiser l’analyse</button>
 </div></main>
}
function Stat({t,v}){return <div style={card}><small>{t}</small><div style={{fontSize:30,fontWeight:800}}>{v??0}</div></div>}
const page={minHeight:'100vh',padding:24,background:'#f4f7fb',fontFamily:'Arial,sans-serif',color:'#172033'},grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,margin:'20px 0'},card={background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 18px #1028400f'},btn={marginTop:16,border:0,borderRadius:10,padding:'11px 16px',background:'#0066ff',color:'#fff',fontWeight:700,cursor:'pointer'}