'use client'
import {useEffect,useState} from 'react'
import {useParams} from 'next/navigation'
import Link from 'next/link'
import AppShell from '../../../../components/AppShell'
import {useI18n} from '../../../../components/I18nProvider'
import {supabase} from '../../../../lib/supabase'

export default function GroupPage(){
 const {id}=useParams(),{t}=useI18n()
 const [group,setGroup]=useState(null),[user,setUser]=useState(null),[member,setMember]=useState(false),[count,setCount]=useState(0),[loading,setLoading]=useState(true)
 useEffect(()=>{load()},[id])
 async function load(){
  setLoading(true)
  const {data:{user:u}}=await supabase.auth.getUser();setUser(u||null)
  const {data:g}=await supabase.from('social_groups').select('id,name,description,is_private,owner_id').eq('id',id).maybeSingle();setGroup(g||null)
  if(g){
   const {count:c}=await supabase.from('social_group_members').select('*',{count:'exact',head:true}).eq('group_id',id);setCount(c||0)
   if(u){const {data:m}=await supabase.from('social_group_members').select('user_id').eq('group_id',id).eq('user_id',u.id).maybeSingle();setMember(!!m)}
  }
  setLoading(false)
 }
 async function join(){
  if(!user||!group||group.is_private)return
  const {error}=await supabase.from('social_group_members').insert({group_id:id,user_id:user.id,role:'member'})
  if(!error){setMember(true);setCount(v=>v+1)}
 }
 async function leave(){
  if(!user||!group||group.owner_id===user.id)return
  const {error}=await supabase.from('social_group_members').delete().eq('group_id',id).eq('user_id',user.id)
  if(!error){setMember(false);setCount(v=>Math.max(0,v-1))}
 }
 if(loading)return <AppShell><main className="group"><p>{t('loading','Loading…')}</p></main></AppShell>
 if(!group)return <AppShell><main className="group"><p>{t('socialGroupMissing','Group unavailable')}</p><Link href="/social">← Social</Link></main></AppShell>
 const owner=user?.id===group.owner_id
 return <AppShell><main className="group"><Link href="/social" className="back">← Social</Link><section className="card"><div className="icon">👥</div><div className="info"><h1 data-user-content data-no-translate>{group.name}</h1>{group.description&&<p data-user-content data-no-translate>{group.description}</p>}<small>{count} {t('socialGroupMembers','members')} · {group.is_private?t('socialPrivate','Private'):t('socialPublic','Public')}</small></div>{user&&!owner&&(member?<button className="leave" onClick={leave}>{t('socialLeaveGroup','Leave')}</button>:!group.is_private&&<button onClick={join}>{t('socialJoinGroup','Join')}</button>)}</section><section className="empty"><h2>{t('socialGroupPosts','Group posts')}</h2><p>{t('socialGroupPostsSoon','Group publishing will appear here.')}</p></section></main><style jsx>{`.group{max-width:900px;margin:auto;padding:20px 14px 50px;color:#172033}.back{display:inline-block;margin-bottom:14px;color:#0b65c8;text-decoration:none;font-weight:800}.card{display:flex;align-items:center;gap:16px;background:#fff;border:1px solid #e1eaf4;border-radius:20px;padding:20px}.icon{width:70px;height:70px;border-radius:18px;display:grid;place-items:center;background:#eaf4ff;font-size:30px}.info{flex:1;min-width:0}.info h1{margin:0 0 6px}.info p{margin:0 0 8px;color:#52647a}.info small{color:#667085}.card button{border:0;border-radius:12px;background:#0b65c8;color:#fff;padding:10px 15px;font-weight:800;cursor:pointer}.card button.leave{background:#eef4fb;color:#0b65c8}.empty{margin-top:16px;background:#fff;border:1px dashed #bdcad8;border-radius:18px;padding:28px;text-align:center}.empty p{color:#667085}@media(max-width:600px){.card{align-items:flex-start;flex-wrap:wrap}.info{min-width:calc(100% - 90px)}}`}</style></AppShell>
}
