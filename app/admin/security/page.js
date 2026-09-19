'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {supabase} from '../../../lib/supabase'

export default function SecurityPage(){
 const[rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 async function load(){setLoading(true);setError('');const{data,error:e}=await supabase.rpc('admin_security_events',{p_limit:200});if(e)setError(e.message);else setRows(data||[]);setLoading(false)}
 useEffect(()=>{load()},[])
 return <main style={p}><div style={{maxWidth:1200,margin:'0 auto'}}><header style={h}><div><h1>🛡️ WakhReek Security Guard</h1><p>Mode surveillance uniquement — aucun blocage automatique.</p></div><div><Link href="/admin">← Admin</Link> <button onClick={load} style={btn}>Actualiser</button></div></header>
 {loading?<section style={card}>Chargement…</section>:error?<section style={card}><b style={{color:'#b42318'}}>{error}</b></section>:<><section style={grid}><Stat t="Événements" v={rows.length}/><Stat t="Haute priorité" v={rows.filter(x=>['high','critical'].includes(x.severity)).length}/><Stat t="Accès Admin refusés" v={rows.filter(x=>x.event_type==='admin_access_denied').length}/></section><section style={card}><h2>Journal de sécurité</h2>{rows.length===0?<p>🟢 Aucun événement de sécurité enregistré depuis l’activation.</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:900}}><thead><tr><th>Date</th><th>Niveau</th><th>Événement</th><th>Pays</th><th>IP</th><th>Chemin</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{new Date(x.created_at).toLocaleString()}</td><td>{level(x.severity)}</td><td>{x.event_type}</td><td>{x.country_code||'—'}</td><td>{x.ip_address||'—'}</td><td>{x.path||'—'}</td></tr>)}</tbody></table></div>}</section></>}
 </div></main>
}
function level(x){return x==='critical'?'🔴 CRITICAL':x==='high'?'🔴 HIGH':x==='medium'?'🟠 MEDIUM':'🟢 LOW'}
function Stat({t,v}){return <div style={card}><small>{t}</small><div style={{fontSize:30,fontWeight:800}}>{v}</div></div>}
const p={minHeight:'100vh',padding:24,background:'#f4f7fb',fontFamily:'Arial,sans-serif',color:'#172033'},h={display:'flex',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:20},grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:16},card={background:'#fff',borderRadius:16,padding:20,boxShadow:'0 4px 18px #1028400f'},btn={border:0,borderRadius:10,padding:'10px 14px',background:'#0066ff',color:'#fff',fontWeight:700,cursor:'pointer',marginLeft:10}
