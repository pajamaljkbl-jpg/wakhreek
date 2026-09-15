'use client'
import {useMemo,useState} from 'react'

function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
export default function MarketAssistant({shops=[],products=[],countries=[],cities=[],onSearch}){
 const[open,setOpen]=useState(false),[text,setText]=useState(''),[answer,setAnswer]=useState('')
 const index=useMemo(()=>({shops,products,countries,cities}),[shops,products,countries,cities])
 function ask(e){e.preventDefault();const q=norm(text);if(!q)return
  const ps=index.products.filter(p=>norm(p.name).includes(q)||norm(p.category).includes(q)).slice(0,5)
  const ss=index.shops.filter(s=>norm(s.name).includes(q)).slice(0,5)
  const productShops=[...new Set(ps.map(p=>p.boutique_id))].map(id=>index.shops.find(s=>s.id===id)).filter(Boolean)
  const found=[...ss,...productShops].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i)
  if(found.length){setAnswer(`وجدت ${found.length} متجرًا مرتبطًا بطلبك: ${found.map(x=>x.name).join('، ')}. سأعرض لك النتائج الموجودة فعليًا في WakhReek.`);onSearch?.(text)}
  else{setAnswer('لم أجد نتيجة مطابقة في متاجر WakhReek النشطة حاليًا. جرّب اسم المنتج أو المتجر أو فئة أقصر. لن أقترح عليك منتجًا غير موجود في السوق.');onSearch?.(text)}
 }
 return <><button onClick={()=>setOpen(x=>!x)} style={fab}>🤖 <span>WakhReek AI</span></button>{open&&<section style={panel} dir="auto"><header style={head}><b>🤖 WakhReek Market AI</b><button onClick={()=>setOpen(false)} style={close}>×</button></header><p style={intro}>أساعدك في العثور على المنتجات والمتاجر الموجودة فعليًا داخل WakhReek Market.</p><div style={quick}><button onClick={()=>{setText('منتج');setAnswer('اكتب اسم المنتج الذي تبحث عنه، وسأبحث داخل متاجر WakhReek النشطة.')}}>🛍 منتج</button><button onClick={()=>{setText('متجر');setAnswer('اكتب اسم المتجر الذي تبحث عنه.')}}>🏪 متجر</button><button onClick={()=>setAnswer('اختر بلدك ومدينتك من أعلى Market، ثم اكتب ما تبحث عنه وسأطابقه مع المتاجر المتاحة.')}>📍 قريب مني</button></div><form onSubmit={ask} style={form}><input value={text} onChange={e=>setText(e.target.value)} placeholder="مثال: صابون مغربي، ملابس، متجر..." autoFocus/><button>بحث</button></form>{answer&&<div style={reply}>{answer}</div>}<small style={{opacity:.65}}>المساعد يعتمد على بيانات WakhReek Market الحالية ولا يوافق على المتاجر أو المدفوعات.</small></section>}</>
}
const fab={position:'fixed',right:20,bottom:24,zIndex:9000,border:0,borderRadius:28,padding:'13px 18px',background:'#111827',color:'#fff',fontWeight:800,cursor:'pointer',boxShadow:'0 8px 30px #0004'}
const panel={position:'fixed',right:20,bottom:82,zIndex:9000,width:'min(390px,calc(100vw - 28px))',background:'#fff',border:'1px solid #dde4ee',borderRadius:18,padding:16,boxShadow:'0 18px 55px #0003',color:'#172033'}
const head={display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:17},close={border:0,background:'transparent',fontSize:25,cursor:'pointer'},intro={fontSize:13,lineHeight:1.5,color:'#596579'},quick={display:'flex',gap:7,flexWrap:'wrap',margin:'10px 0'},form={display:'flex',gap:7,margin:'12px 0'},reply={background:'#eef6ff',padding:12,borderRadius:12,lineHeight:1.6,marginBottom:10}
