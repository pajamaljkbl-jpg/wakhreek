'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {supabase} from '../../../lib/supabase'

export default function AdminAnalytics(){
 const[data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('')
 async function load(){setLoading(true);setError('');const{data:d,error:e}=await supabase.rpc('admin_platform_analytics');if(e)setError(e.message);else setData(d);setLoading(false)}
 useEffect(()=>{load()},[])
 if(loading)return <main style={page}><div style={card}>Chargement des statistiques WakhReek…</div></main>
 if(error)return <main style={page}><div style={card}><h1>Statistiques WakhReek</h1><p style={{color:'#b42318'}}>{error}</p><Link href="/admin">← Admin</Link></div></main>
 return <main style={page}><div style={{maxWidth:1100,margin:'0 auto'}}>
  <header style={head}><div><h1>📊 Statistiques WakhReek</h1><p>Inscriptions et téléchargements APK — données administrateur.</p></div><div><Link href="/admin" style={link}>← Admin</Link><button onClick={load} style={btn}>Actualiser</button></div></header>
  <section style={grid}><Stat t="Inscriptions totales" v={data?.registrations_total}/><Stat t="Téléchargements APK" v={data?.apk_downloads_total}/><Stat t="Sessions APK uniques" v={data?.apk_unique_sessions}/></section>
  <section style={two}><Breakdown title="🌍 Inscriptions par pays" rows={data?.registrations_by_country}/><Breakdown title="📱 APK par pays" rows={data?.apk_by_country}/></section>
  <Breakdown title="🎯 Source — Direct / Publicité" rows={data?.by_source} keyName="source" />
  <p style={{fontSize:13,opacity:.7}}>UNKNOWN = anciens comptes ou événements créés avant l’enregistrement du pays. Direct = accès sans attribution publicitaire.</p>
 </div></main>
}
function Stat({t,v}){return <div style={card}><small>{t}</small><div style={{fontSize:34,fontWeight:800,marginTop:5}}>{v??0}</div></div>}
function Breakdown({title,rows=[],keyName='country'}){return <section style={card}><h2>{title}</h2>{rows?.length?rows.map((r,i)=><div key={`${r[keyName]}-${i}`} style={row}><span>{r[keyName]||'UNKNOWN'}</span><b>{r.total}</b></div>):<p>Aucune donnée pour le moment.</p>}</section>}
const page={minHeight:'100vh',padding:24,background:'#f4f7fb',fontFamily:'Arial,sans-serif',color:'#172033'},head={display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:20},grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,marginBottom:16},two={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,marginBottom:16},card={background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 18px #1028400f'},row={display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #eee'},btn={border:0,borderRadius:10,padding:'10px 14px',background:'#0066ff',color:'#fff',fontWeight:700,cursor:'pointer',marginLeft:10},link={textDecoration:'none',color:'#0066ff'}