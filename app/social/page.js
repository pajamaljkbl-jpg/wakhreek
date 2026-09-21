'use client'

import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
import AppShell from '../../components/AppShell'
import {useI18n} from '../../components/I18nProvider'
import {supabase} from '../../lib/supabase'

export default function SocialPage(){
 const router=useRouter()
 const {t}=useI18n()
 const [ads,setAds]=useState([]),[shops,setShops]=useState([]),[posts,setPosts]=useState([]),[user,setUser]=useState(null),[draft,setDraft]=useState(''),[posting,setPosting]=useState(false),[loading,setLoading]=useState(true),[gate,setGate]=useState(false),[likes,setLikes]=useState([]),[comments,setComments]=useState([]),[commentPost,setCommentPost]=useState(null),[commentDraft,setCommentDraft]=useState(''),[commenting,setCommenting]=useState(false),[follows,setFollows]=useState([]),[media,setMedia]=useState(null)
 useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data?.user||null));load()},[])
 async function load(){
  setLoading(true)
  const now=new Date().toISOString()
  const [{data:a},{data:b},{data:p}]=await Promise.all([
   supabase.from('market_tv_ads').select('id,boutique_id,title,description,media_type,media_url,created_at').eq('status','active').or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`).order('created_at',{ascending:false}).limit(30),
   supabase.from('boutiques').select('id,name,description,logo_url').eq('is_live',true).order('created_at',{ascending:false}).limit(12),
   supabase.from('social_posts').select('id,author_id,body,media_type,media_url,boutique_id,created_at,profiles!social_posts_author_id_fkey(display_name,avatar_url)').order('created_at',{ascending:false}).limit(20)
  ])
  setAds(a||[]);setShops(b||[]);setPosts(p||[])
  const ids=(p||[]).map(x=>x.id)
  if(ids.length){
   const [{data:l},{data:cm}]=await Promise.all([
    supabase.from('social_likes').select('post_id,user_id').in('post_id',ids),
    supabase.from('social_comments').select('id,post_id,author_id,body,created_at,profiles!social_comments_author_id_fkey(display_name,avatar_url)').in('post_id',ids).order('created_at',{ascending:true})
   ])
   setLikes(l||[]);setComments(cm||[])
   if(user){const {data:fw}=await supabase.from('social_follows').select('following_id').eq('follower_id',user.id);setFollows(fw||[])}
  }else{setLikes([]);setComments([])}
  setLoading(false)
 }
 const locked=()=>setGate(true)
 const likeCount=postId=>likes.filter(x=>x.post_id===postId).length
 const postComments=postId=>comments.filter(x=>x.post_id===postId)
 function openComments(postId){if(!user){setGate(true);return}setCommentPost(commentPost===postId?null:postId);setCommentDraft('')}
 async function addComment(postId){
  const body=commentDraft.trim()
  if(!user){setGate(true);return}
  if(!body||commenting)return
  setCommenting(true)
  const {data,error}=await supabase.from('social_comments').insert({post_id:postId,author_id:user.id,body}).select('id,post_id,author_id,body,created_at,profiles!social_comments_author_id_fkey(display_name,avatar_url)').single()
  if(!error&&data){setComments(v=>[...v,data]);setCommentDraft('')}
  setCommenting(false)
 }
 const following=userId=>follows.some(x=>x.following_id===userId)
 async function toggleFollow(userId){
  if(!user){setGate(true);return}
  if(userId===user.id)return
  if(following(userId)){
   const {error}=await supabase.from('social_follows').delete().eq('follower_id',user.id).eq('following_id',userId)
   if(!error)setFollows(v=>v.filter(x=>x.following_id!==userId))
  }else{
   const {error}=await supabase.from('social_follows').insert({follower_id:user.id,following_id:userId})
   if(!error)setFollows(v=>[...v,{following_id:userId}])
  }
 }
 const likedByMe=postId=>!!user&&likes.some(x=>x.post_id===postId&&x.user_id===user.id)
 async function toggleLike(postId){
  if(!user){setGate(true);return}
  const liked=likedByMe(postId)
  if(liked){
   const {error}=await supabase.from('social_likes').delete().eq('post_id',postId).eq('user_id',user.id)
   if(!error)setLikes(v=>v.filter(x=>!(x.post_id===postId&&x.user_id===user.id)))
  }else{
   const {error}=await supabase.from('social_likes').insert({post_id:postId,user_id:user.id})
   if(!error)setLikes(v=>[...v,{post_id:postId,user_id:user.id}])
  }
 }
 async function sharePost(post){
  const url=window.location.origin+'/social#post-'+post.id
  const shareData={title:'WakhReek Social',text:(post.body||'WakhReek Social').slice(0,180),url}
  try{
   if(navigator.share){await navigator.share(shareData)}
   else{await navigator.clipboard.writeText(url);alert(t('socialLinkCopied','Link copied'))}
  }catch(e){if(e?.name!=='AbortError')alert(t('socialShareFailed','Sharing unavailable'))}
 }
 async function publish(){
  const body=draft.trim()
  if(!user){setGate(true);return}
  if((!body&&!media)||posting)return
  setPosting(true)
  let media_url=null,media_type=null
  if(media){
   const allowed=['image/jpeg','image/png','image/webp','video/mp4','video/webm']
   if(!allowed.includes(media.type)||media.size>52428800){alert(t('socialMediaInvalid','Unsupported file or file too large'));setPosting(false);return}
   media_type=media.type.startsWith('video/')?'video':'image'
   const ext=(media.name.split('.').pop()||'bin').toLowerCase()
   const path=user.id+'/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext
   const {error:uploadError}=await supabase.storage.from('social-media').upload(path,media,{contentType:media.type,upsert:false})
   if(uploadError){alert(t('socialMediaUploadFailed','Upload failed'));setPosting(false);return}
   media_url=supabase.storage.from('social-media').getPublicUrl(path).data.publicUrl
  }
  const {error}=await supabase.from('social_posts').insert({author_id:user.id,body:body||null,media_type,media_url})
  if(!error){setDraft('');setMedia(null);await load()}
  else alert(t('socialPublishFailed','Publication unavailable'))
  setPosting(false)
 }
 return <AppShell><main className="social">
  <header className="head"><div><span className="brand">WakhReek Social</span><h1>{t('socialHero')}</h1><p>{t('socialTopics')}</p></div><button onClick={locked}>{t('socialJoin')}</button></header>
  <section className="welcome"><div><b>{t('socialWelcome')}</b><p>{t('socialPreview')}</p></div><button onClick={locked}>{t('socialMore')}</button></section>
  {user&&<section className="composer"><textarea value={draft} maxLength={3000} onChange={e=>setDraft(e.target.value)} placeholder={t('socialPlaceholder')} />{media&&<div className="selectedmedia"><span>{media.name}</span><button onClick={()=>setMedia(null)}>×</button></div>}<div><label className="mediaBtn">＋ {t('socialAddMedia','Photo / Video')}<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={e=>setMedia(e.target.files?.[0]||null)} /></label><small>{draft.length}/3000</small><button disabled={(!draft.trim()&&!media)||posting} onClick={publish}>{posting?t('socialPublishing'):t('socialPublish')}</button></div></section>}
  {loading?<div className="empty">{t('loading')}</div>:<>
   {posts.length>0&&<section className="feed">{posts.map(post=><article className="post" id={'post-'+post.id} key={post.id}>
    <div className="posttop">{post.profiles?.avatar_url?<img className="useravatar" src={post.profiles.avatar_url} alt="" />:<div className="avatar">WR</div>}<div><div className="authorline"><b data-user-content data-no-translate>{post.profiles?.display_name||'WakhReek'}</b>{(!user||post.author_id!==user.id)&&<button className={following(post.author_id)?'following':''} onClick={()=>toggleFollow(post.author_id)}>{following(post.author_id)?t('socialFollowing','Following'):t('socialFollow','Follow')}</button>}</div><small>{new Date(post.created_at).toLocaleString()}</small></div></div>
    {post.body&&<p className="socialbody" data-user-content data-no-translate>{post.body}</p>}{post.media_url&&(post.media_type==='video'?<video className="socialmedia" src={post.media_url} controls playsInline preload="metadata"/>:<img className="socialmedia" src={post.media_url} alt="" />)}
    <div className="postactions"><button className={likedByMe(post.id)?'liked':''} onClick={()=>toggleLike(post.id)}>{likedByMe(post.id)?'♥':'♡'} {t('socialLike').replace(/^♡\s*/,'')} {likeCount(post.id)>0&&<span>{likeCount(post.id)}</span>}</button><button onClick={()=>openComments(post.id)}>{t('socialComment')} {postComments(post.id).length>0&&<span>{postComments(post.id).length}</span>}</button><button onClick={()=>sharePost(post)}>{t('socialShare')}</button></div>
    {commentPost===post.id&&<div className="comments">{postComments(post.id).map(cm=><div className="comment" key={cm.id}><b data-user-content data-no-translate>{cm.profiles?.display_name||'WakhReek'}</b><p data-user-content data-no-translate>{cm.body}</p></div>)}<div className="commentbox"><textarea value={commentDraft} maxLength={2000} onChange={e=>setCommentDraft(e.target.value)} placeholder={t('socialCommentPlaceholder','Write a comment…')} /><button disabled={!commentDraft.trim()||commenting} onClick={()=>addComment(post.id)}>{commenting?t('socialPublishing'):t('socialCommentSend','Send')}</button></div></div>}
   </article>)}</section>}
   {ads.length>0&&<section className="feed sponsored">{ads.slice(0,5).map(ad=><article className="post" key={ad.id}>
    <div className="posttop"><div className="avatar">WR</div><div><b>WakhReek</b><small>{t('socialSponsored')}</small></div></div>
    {ad.description&&<p className="caption" data-user-content data-no-translate>{ad.description}</p>}
    {ad.media_type==='video'?<video src={ad.media_url} controls playsInline preload="metadata"/>:<img src={ad.media_url} alt={ad.title}/>}
    <div className="body"><h2 data-user-content data-no-translate>{ad.title}</h2><div className="actions"><button onClick={locked}>{t('socialLike')}</button><button onClick={locked}>{t('socialComment')}</button><button onClick={locked}>{t('socialShare')}</button></div>{ad.boutique_id&&<button className="shopbtn" onClick={locked}>{t('socialViewShop')}</button>}</div>
   </article>)}</section>}
   {ads.length===0&&<section className="empty"><div className="play">▶</div><h2>{t('socialArrives')}</h2><p>{t('socialFirst')}</p></section>}
   {shops.length>0&&<section className="shops"><h2>{t('socialShops')}</h2><div className="shopgrid">{shops.slice(0,6).map(s=><button className="shop" key={s.id} onClick={locked}>{s.logo_url?<img src={s.logo_url} alt={s.name}/>:<span className="placeholder">WR</span>}<span><b data-user-content data-no-translate>{s.name}</b><small>{t('socialSee')}</small></span></button>)}</div></section>}
  </>}
  <section className="locked"><span>🔒</span><h2>{t('socialLocked')}</h2><p>{t('socialLockedText')}</p><button onClick={locked}>{t('socialEnter')}</button></section>
  {gate&&<div className="overlay" onClick={()=>setGate(false)}><div className="gate" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setGate(false)}>×</button><div className="logo">W</div><h2>{t('socialGateTitle')}</h2><p>{t('socialGateText')}</p><video src="/Ma%20vid%C3%A9o-80.mp4" controls playsInline preload="metadata"/><button className="download" onClick={()=>router.push('/download')}>{t('socialDownload')}</button><button className="account" onClick={()=>router.push('/')}>{t('socialCreate')}</button></div></div>}
 </main><style jsx>{`
 .social{max-width:760px;margin:auto;padding:14px 14px 50px;color:#172033}.head{background:linear-gradient(135deg,#071a35,#0b65c8);color:#fff;border-radius:22px;padding:26px;display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-weight:900;color:#ffad3d}.head h1{margin:7px 0;font-size:30px}.head p{margin:0;opacity:.85}.head button,.welcome button,.locked button{border:0;border-radius:12px;background:#ff9818;color:#fff;font-weight:900;padding:12px 16px;cursor:pointer}.welcome{margin:15px 0;background:#fff;border:1px solid #dce5ef;border-radius:16px;padding:16px;display:flex;align-items:center;justify-content:space-between;gap:15px}.welcome p{margin:5px 0 0;color:#667085}.composer{margin:15px 0;background:#fff;border:1px solid #dce5ef;border-radius:16px;padding:14px}.composer textarea{width:100%;min-height:92px;resize:vertical;border:1px solid #dce5ef;border-radius:12px;padding:12px;font:inherit;box-sizing:border-box}.composer>div{display:flex;align-items:center;justify-content:space-between;margin-top:8px}.composer small{color:#667085}.mediaBtn{border:1px solid #dce5ef;border-radius:10px;padding:9px 11px;font-weight:800;cursor:pointer}.mediaBtn input{display:none}.selectedmedia{display:flex;justify-content:space-between;align-items:center;background:#f5f7fa;border-radius:10px;padding:8px 10px;margin-top:8px;gap:10px;overflow:hidden}.selectedmedia span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.selectedmedia button{border:0!important;background:transparent!important;color:#667085!important;padding:2px 6px!important;font-size:20px}.socialmedia{width:100%;max-height:520px;object-fit:cover;background:#050505}.composer button{border:0;border-radius:10px;background:#0b7fe5;color:#fff;font-weight:900;padding:10px 18px;cursor:pointer}.composer button:disabled{opacity:.45;cursor:not-allowed}.feed{display:grid;gap:16px}.sponsored{margin-top:16px}.post{background:#fff;border:1px solid #dce5ef;border-radius:18px;overflow:hidden;box-shadow:0 7px 24px rgba(20,45,80,.07)}.posttop{display:flex;gap:10px;align-items:center;padding:14px}.avatar,.logo{display:grid;place-items:center;background:#0b7fe5;color:#fff;font-weight:900}.avatar,.useravatar{width:42px;height:42px;border-radius:50%}.useravatar{object-fit:cover}.socialbody{padding:0 14px 16px;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.posttop>div:last-child{display:grid;flex:1}.authorline{display:flex;align-items:center;justify-content:space-between;gap:10px}.authorline button{border:1px solid #0b7fe5;background:#fff;color:#0b7fe5;border-radius:999px;padding:5px 10px;font-weight:800;cursor:pointer}.authorline button.following{background:#0b7fe5;color:#fff}.posttop small{color:#667085}.caption{padding:0 14px;margin:0 0 12px}.post>video,.post>img{width:100%;max-height:520px;object-fit:cover;background:#050505}.body{padding:14px}.body h2{margin:0 0 12px}.postactions,.actions{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #edf1f5;border-bottom:1px solid #edf1f5}.postactions button,.actions button{border:0;background:#fff;padding:12px 4px;font-weight:700;cursor:pointer;color:#4b5565}.postactions{grid-template-columns:repeat(3,1fr);border-top:1px solid #edf1f5}.comments{padding:12px 14px;border-top:1px solid #edf1f5}.comment{background:#f5f7fa;border-radius:12px;padding:9px 11px;margin-bottom:8px}.comment p{margin:3px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.commentbox{display:flex;gap:8px;align-items:flex-end}.commentbox textarea{flex:1;min-height:44px;max-height:120px;resize:vertical;border:1px solid #dce5ef;border-radius:10px;padding:9px;font:inherit}.commentbox button{border:0;border-radius:10px;background:#0b7fe5;color:#fff;font-weight:800;padding:10px 13px}.commentbox button:disabled{opacity:.45}.postactions .liked{color:#d92d20}.postactions span{font-weight:900}.shopbtn{margin-top:12px;width:100%;border:0;border-radius:11px;padding:11px;background:#0b7fe5;color:#fff;font-weight:800}.shops{margin-top:22px}.shopgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.shop{border:1px solid #dce5ef;background:#fff;border-radius:14px;padding:10px;display:flex;align-items:center;gap:10px;text-align:left}.shop img,.placeholder{width:50px;height:50px;border-radius:12px;object-fit:cover}.placeholder{display:grid;place-items:center;background:#0b7fe5;color:#fff;font-weight:900}.shop>span:last-child{display:grid}.shop small{color:#667085}.locked,.empty{text-align:center;margin-top:18px;padding:34px 20px;background:#fff;border:1px dashed #bdcad8;border-radius:18px}.locked>span{font-size:34px}.locked h2{margin:8px}.locked p,.empty p{color:#667085}.play{margin:auto;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#0b7fe5;color:#fff}.overlay{position:fixed;inset:0;background:rgba(4,12,24,.72);z-index:9999;display:grid;place-items:center;padding:16px}.gate{width:min(480px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;padding:24px;position:relative;text-align:center}.close{position:absolute;right:12px;top:9px;border:0;background:transparent;font-size:28px;cursor:pointer}.logo{width:54px;height:54px;border-radius:15px;margin:auto;font-size:28px}.gate h2{margin:10px 0 6px}.gate p{color:#667085}.gate video{width:100%;border-radius:13px;background:#000;max-height:280px}.download,.account{width:100%;border:0;border-radius:12px;padding:13px;font-weight:900;cursor:pointer;margin-top:10px}.download{background:#ff9818;color:#fff}.account{background:#0b7fe5;color:#fff}
 @media(max-width:650px){.social{padding:8px}.head{display:block;padding:20px}.head h1{font-size:25px}.head button{margin-top:15px}.welcome{display:block}.welcome button{margin-top:12px}.shopgrid{grid-template-columns:1fr}.actions button{font-size:12px}}
 `}</style></AppShell>
}
