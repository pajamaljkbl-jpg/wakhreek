'use client'
import {useState} from 'react'
import {supabase} from '../../../lib/supabase'

export default function AdminAI(){
 const[prompt,setPrompt]=useState(''),[size,setSize]=useState('square_hd'),[busy,setBusy]=useState(false),[result,setResult]=useState(null),[error,setError]=useState('')
 async function generate(){
  setBusy(true);setError('');setResult(null)
  const{data:{session}}=await supabase.auth.getSession()
  if(!session){window.location.href='/login';return}
  const r=await fetch('/api/admin/ai/image',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({prompt,image_size:size})})
  const d=await r.json().catch(()=>({}))
  if(!r.ok)setError(typeof d.error==='string'?d.error:JSON.stringify(d.error||'Generation failed'));else setResult(d)
  setBusy(false)
 }
 return <main className="studio">
  <header><div><h1>WakhReek AI Studio</h1><p>مولد داخلي للإدارة — الصور أولاً</p></div><button className="back" onClick={()=>location.href='/admin'}>← Admin</button></header>
  <section>
   <label>وصف الصورة / Prompt</label>
   <textarea rows="7" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="مثال: إعلان احترافي لمنتج مغربي، إضاءة استوديو، خلفية نظيفة..."/>
   <div className="row"><label>المقاس<select value={size} onChange={e=>setSize(e.target.value)}><option value="square_hd">مربع HD</option><option value="portrait_4_3">عمودي 4:3</option><option value="portrait_16_9">عمودي 16:9</option><option value="landscape_4_3">أفقي 4:3</option><option value="landscape_16_9">أفقي 16:9</option></select></label><button disabled={busy||prompt.trim().length<3} onClick={generate}>{busy?'جاري التوليد...':'✨ توليد الصورة'}</button></div>
   {error&&<p className="err">{error}</p>}
  </section>
  {result?.image?.url&&<section className="out"><h2>النتيجة</h2><img src={result.image.url} alt="AI result"/><div className="meta">Model: {result.model}{result.seed!==undefined?` · Seed: ${result.seed}`:''}</div><a href={result.image.url} target="_blank" rel="noreferrer">فتح الصورة الأصلية</a></section>}
  <style jsx>{`.studio{min-height:100vh;background:#f5f7fb;padding:28px;font-family:Arial;color:#172033}header,section{max-width:1000px;margin:0 auto 16px}header{display:flex;justify-content:space-between;align-items:center}section{background:#fff;border:1px solid #e2e7ef;border-radius:16px;padding:20px}textarea,select{width:100%;box-sizing:border-box;margin-top:7px;padding:12px;border:1px solid #ccd5e2;border-radius:10px;font:inherit}textarea{resize:vertical}.row{display:grid;grid-template-columns:1fr 220px;gap:14px;align-items:end;margin-top:14px}button,.out a{border:0;border-radius:10px;padding:12px 16px;background:#0868d7;color:white;font-weight:800;text-decoration:none;text-align:center}.back{background:#172033}button:disabled{opacity:.55}.err{background:#ffe8e8;color:#a00000;padding:12px;border-radius:9px}.out{text-align:center}.out img{max-width:100%;max-height:720px;border-radius:12px}.meta{margin:10px;color:#667085}.out a{display:inline-block;margin-top:8px}@media(max-width:650px){.studio{padding:14px}.row{grid-template-columns:1fr}header{gap:10px}header h1{font-size:22px}}`}</style>
 </main>
}
