'use client'

import {useEffect,useState} from 'react'
import {useParams,useRouter} from 'next/navigation'
import AppShell from '../../../../../components/AppShell'
import {supabase} from '../../../../../lib/supabase'

export default function BoutiqueContactPage(){
  const {id}=useParams()
  const router=useRouter()
  const [boutique,setBoutique]=useState(null)
  const [user,setUser]=useState(null)
  const [messages,setMessages]=useState([])
  const [text,setText]=useState('')
  const [notice,setNotice]=useState('')
  const [loading,setLoading]=useState(true)

  async function load(){
    setLoading(true)
    const {data:auth}=await supabase.auth.getUser()
    const currentUser=auth?.user||null
    setUser(currentUser)
    const {data:b}=await supabase.from('boutiques').select('id,user_id,name,owner_display_name,owner_job_title,logo_url,is_live').eq('id',id).eq('is_live',true).maybeSingle()
    setBoutique(b||null)
    if(b&&currentUser){
      const {data:m}=await supabase.from('market_boutique_messages').select('*').eq('boutique_id',b.id).or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`).order('created_at',{ascending:true})
      setMessages(m||[])
    }
    setLoading(false)
  }

  useEffect(()=>{load()},[id])

  async function sendMessage(){
    setNotice('')
    if(!user)return setNotice('Connectez-vous à WakhReek pour écrire à la boutique.')
    if(!boutique)return
    if(user.id===boutique.user_id)return setNotice('Vous êtes le propriétaire de cette boutique.')
    if(!text.trim())return
    const {error}=await supabase.from('market_boutique_messages').insert({boutique_id:boutique.id,sender_id:user.id,recipient_id:boutique.user_id,message_type:'text',body:text.trim()})
    if(error)return setNotice(error.message)
    setText('')
    await load()
  }

  function showCallNotice(type){
    setNotice(type==='video'?'📹 Appel vidéo — bouton visible des deux côtés, activation de la connexion en prochaine étape.':'📞 Appel audio — bouton visible des deux côtés, activation de la connexion en prochaine étape.')
  }

  if(loading)return <AppShell><main className="contactPage"><div className="panel">Chargement...</div></main></AppShell>
  if(!boutique)return <AppShell><main className="contactPage"><div className="panel"><h2>Boutique indisponible</h2><button onClick={()=>router.push('/market')}>Retour au Marché</button></div></main></AppShell>
  const owner=boutique.owner_display_name||boutique.name

  return <AppShell><main className="contactPage">
    <div className="phoneWindow">
      <header className="contactHeader">
        <button className="back" onClick={()=>router.push(`/market/boutique/${boutique.id}`)}>←</button>
        <div className="avatar">{boutique.logo_url?<img src={boutique.logo_url} alt={owner}/>:'👤'}</div>
        <div className="who"><b>{owner}</b><span>{boutique.owner_job_title||boutique.name}</span></div>
      </header>
      <div className="tools">
        <button className="active">💬<span>Message</span></button>
        <button disabled>📷<span>Photo</span></button>
        <button disabled>🎙️<span>Audio</span></button>
        <button disabled>🎥<span>Vidéo</span></button>
        <button className="call" onClick={()=>showCallNotice('audio')}>📞<span>Appel</span></button>
        <button className="call" onClick={()=>showCallNotice('video')}>📹<span>Visio</span></button>
      </div>
      <div className="thread">
        {!user?<div className="empty">Connectez-vous pour contacter cette boutique.</div>:messages.length===0?<div className="empty">Commencez la conversation avec la boutique.</div>:messages.map(m=><div key={m.id} className={`bubble ${m.sender_id===user.id?'mine':'theirs'}`}><p>{m.body}</p><small>{new Date(m.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</small></div>)}
      </div>
      <div className="composer">
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Écrire un message..." maxLength={4000}/>
        <button onClick={sendMessage}>Envoyer</button>
      </div>
      {notice&&<p className="notice">{notice}</p>}
    </div>
  </main><style jsx>{`
    .contactPage{min-height:calc(100vh - 140px);padding:20px;background:#eef3f9;display:flex;justify-content:center;align-items:flex-start;color:#172033}
    .phoneWindow{width:min(100%,620px);height:calc(100vh - 180px);min-height:580px;background:#fff;border:1px solid #d9e1ea;border-radius:22px;overflow:hidden;display:grid;grid-template-rows:auto auto 1fr auto auto;box-shadow:0 12px 30px rgba(15,40,80,.12)}
    .contactHeader{background:#0875e8;color:#fff;padding:13px 15px;display:flex;align-items:center;gap:11px}.back{background:transparent;border:0;color:#fff;font-size:25px;cursor:pointer}.avatar{width:48px;height:48px;border-radius:50%;background:#fff;overflow:hidden;display:grid;place-items:center}.avatar img{width:100%;height:100%;object-fit:cover}.who{display:grid}.who span{font-size:12px;opacity:.85}
    .tools{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:9px;border-bottom:1px solid #e4e9ef;background:#f8fafc}.tools button{border:0;background:#eef3f8;border-radius:9px;padding:8px 4px;display:grid;gap:3px;place-items:center;font-size:18px}.tools button span{font-size:9px}.tools .active{background:#dcebff;color:#075dcc}.tools .call{background:#e7f7ed;color:#176b3a;cursor:pointer;font-weight:800}.tools button:disabled{opacity:.45}
    .thread{padding:15px;overflow-y:auto;background:#f5f7fa;display:flex;flex-direction:column;gap:9px}.empty{margin:auto;color:#667085;text-align:center}.bubble{max-width:78%;padding:9px 11px;border-radius:13px}.bubble p{margin:0;white-space:pre-wrap}.bubble small{display:block;margin-top:4px;font-size:9px;color:#667085}.mine{align-self:flex-end;background:#dcebff}.theirs{align-self:flex-start;background:#fff;border:1px solid #e0e6ed}
    .composer{display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px;border-top:1px solid #e4e9ef;background:#fff}.composer textarea{resize:none;min-height:45px;max-height:110px;border:1px solid #ccd5e2;border-radius:12px;padding:10px;font:inherit}.composer button,.panel button{border:0;border-radius:10px;background:#0875e8;color:#fff;font-weight:800;padding:0 15px;cursor:pointer}.notice{margin:0;padding:8px 12px;background:#fff4e5;color:#8a5200;font-size:12px}
    .panel{background:#fff;padding:20px;border-radius:14px}
    @media(max-width:700px){.contactPage{padding:0;min-height:calc(100vh - 130px)}.phoneWindow{width:100%;height:calc(100vh - 130px);min-height:0;border-radius:0;border-left:0;border-right:0}.tools{grid-template-columns:repeat(6,1fr)}.tools button{padding:7px 2px}.composer{grid-template-columns:1fr auto}}
  `}</style></AppShell>
}
