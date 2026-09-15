'use client'
import {useEffect,useState} from 'react'
import {supabase} from '../../../lib/supabase'

export default function AdminServices(){
 const[ok,setOk]=useState(null),[items,setItems]=useState([]),[edit,setEdit]=useState({}),[busy,setBusy]=useState('')
 async function load(){const{data:u}=await supabase.auth.getUser();const admin=u?.user?.app_metadata?.role==='admin';setOk(admin);if(!admin)return;const{data,error}=await supabase.rpc('admin_service_orders');if(error)alert(error.message);else setItems(data||[])}
 useEffect(()=>{load()},[])
 async function save(o){setBusy(o.id);const e=edit[o.id]||{};const{error}=await supabase.rpc('admin_update_service_order',{p_order_id:o.id,p_status:e.status||o.status,p_payment_status:e.payment_status||o.payment_status,p_quoted_price:e.price===''?null:Number(e.price??o.quoted_price),p_preview_file_path:o.preview_file_path||null,p_pending_final_file_path:o.pending_final_file_path||null,p_worker_percent:o.worker_percent||null});if(error)alert(error.message);else await load();setBusy('')}
 if(ok===null)return <main style={{padding:40}}>Chargement...</main>
 if(!ok)return <main style={{padding:40}}>Admin only</main>
 return <main className="a">
  <header><div><h1>WakhReek Services — Admin</h1><p>Commandes, prix, paiement et livraison</p></div><button onClick={()=>{window.location.href='/admin'}}>← Admin</button></header>
  {items.length===0?<section>Aucune commande.</section>:items.map(o=>{const e=edit[o.id]||{};return <article key={o.id}>
   <div className="head"><div><h3>{o.service_name} — {o.title}</h3><small>#{o.id} · {o.contact_name} · {o.contact_phone}</small></div><b>{o.payment_status}</b></div>
   <p>{o.instructions}</p>
   <div className="grid">
    <label>Prix final<input type="number" value={e.price??o.quoted_price??''} onChange={x=>setEdit({...edit,[o.id]:{...e,price:x.target.value}})}/></label>
    <label>État<select value={e.status||o.status} onChange={x=>setEdit({...edit,[o.id]:{...e,status:x.target.value}})}>{['requested','quoted','awaiting_payment','paid','in_progress','preview_ready','completed','cancelled'].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
    <label>Paiement<select value={e.payment_status||o.payment_status} onChange={x=>setEdit({...edit,[o.id]:{...e,payment_status:x.target.value}})}>{['unpaid','pending','paid','refunded'].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   </div>
   {o.payment_reference&&<p className="pay">💳 {o.payment_method_code}: <b>{o.payment_reference}</b></p>}
   <button disabled={busy===o.id} onClick={()=>save(o)}>Enregistrer</button>
  </article>})}
  <style jsx>{`.a{min-height:100vh;background:#f5f7fb;padding:28px;font-family:Arial;color:#172033}header{max-width:1100px;margin:auto;display:flex;justify-content:space-between;align-items:center}section,article{max-width:1100px;margin:14px auto;background:#fff;border-radius:14px;padding:20px;border:1px solid #e2e7ef}.head{display:flex;justify-content:space-between;gap:15px}.head small{color:#667085}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.grid label{font-weight:700}.grid input,.grid select{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;border:1px solid #ccd5e2;border-radius:8px}.pay{background:#fff6dc;padding:10px;border-radius:8px}button{border:0;border-radius:9px;padding:10px 14px;background:#0868d7;color:#fff;font-weight:800}@media(max-width:700px){.grid{grid-template-columns:1fr}.a{padding:14px}}`}</style>
 </main>
}
