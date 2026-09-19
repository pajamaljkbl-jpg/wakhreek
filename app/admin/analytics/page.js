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
  <header style={head}><div><h1>📊 Statistiques WakhReek</h1><p>Visiteurs, inscriptions et téléchargements APK — données administrateur.</p></div><div><Link href="/admin" style={link}>← Admin</Link><button onClick={load} style={btn}>Actualiser</button></div></header>
  <section style={grid}><Stat t="Visites" v={data?.visits_total}/><Stat t="Visiteurs uniques" v={data?.visitors_unique}/><Stat t="Inscriptions totales" v={data?.registrations_total}/><Stat t="Téléchargements APK" v={data?.apk_downloads_total}/><Stat t="Sessions APK uniques" v={data?.apk_unique_sessions}/></section>
  <section style={three}><VisitorCountries rows={data?.visitors_by_country}/><Breakdown title="🌍 Inscriptions par pays" rows={data?.registrations_by_country}/><Breakdown title="📱 APK par pays" rows={data?.apk_by_country}/></section>
  <SourceBreakdown rows={data?.by_source}/>
  <p style={{fontSize:13,opacity:.7}}>UNKNOWN = visites ou comptes enregistrés avant la détection automatique du pays. Les nouvelles visites utilisent le pays détecté par l’infrastructure WakhReek.</p>
 </div></main>
}
function Stat({t,v}){return <div style={card}><small>{t}</small><div style={{fontSize:34,fontWeight:800,marginTop:5}}>{v??0}</div></div>}
function Breakdown({title,rows=[],keyName='country'}){return <section style={card}><h2>{title}</h2>{rows?.length?rows.map((r,i)=><div key={`${r[keyName]}-${i}`} style={row}><span>{r[keyName]||'UNKNOWN'}</span><b>{r.total}</b></div>):<p>Aucune donnée pour le moment.</p>}</section>}
function SourceBreakdown({rows=[]}){return <section style={card}><h2>🎯 Source — parcours des visiteurs</h2>{rows?.length?rows.map((r,i)=><div key={`${r.source}-${i}`} style={row}><span><b>{r.source||'direct'}</b></span><span>{r.unique_visitors??0} visiteurs · {r.visits??0} visites · {r.apk_downloads??0} APK ({r.apk_unique_sessions??0} sessions) · {r.registrations??0} inscriptions</span></div>):<p>Aucune donnée pour le moment.</p>}</section>}
function VisitorCountries({rows=[]}){return <section style={card}><h2>🌍 Visiteurs par pays</h2>{rows?.length?rows.map((r,i)=><div key={`${r.country}-${i}`} style={row}><span>{r.country||'UNKNOWN'}</span><span><b>{r.unique_visitors??0}</b> visiteurs · {r.visits??0} visites</span></div>):<p>Aucune donnée pour le moment.</p>}</section>}
const page={minHeight:'100vh',padding:24,background:'#f4f7fb',fontFamily:'Arial,sans-serif',color:'#172033'},head={display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:20},grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:14,marginBottom:16},three={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,marginBottom:16},card={background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 18px #1028400f'},row={display:'flex',justifyContent:'space-between',gap:12,padding:'10px 0',borderBottom:'1px solid #eee'},btn={border:0,borderRadius:10,padding:'10px 14px',background:'#0066ff',color:'#fff',fontWeight:700,cursor:'pointer',marginLeft:10},link={textDecoration:'none',color:'#0066ff'}