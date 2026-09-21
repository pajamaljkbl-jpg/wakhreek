'use client'

import {useEffect,useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import AppShell from '../../components/AppShell'
import {useI18n} from '../../components/I18nProvider'
import {supabase} from '../../lib/supabase'

export default function SocialPage(){
 const router=useRouter()
 const {t}=useI18n()
 const [ads,setAds]=useState([]),[shops,setShops]=useState([]),[posts,setPosts]=useState([]),[loadingPosts,setLoadingPosts]=useState(true),[user,setUser]=useState(null),[draft,setDraft]=useState(''),[posting,setPosting]=useState(false),[loading,setLoading]=useState(true),[gate,setGate]=useState(false),[likes,setLikes]=useState([]),[comments,setComments]=useState([]),[commentPost,setCommentPost]=useState(null),[commentDraft,setCommentDraft]=useState(''),[commenting,setCommenting]=useState(false),[follows,setFollows]=useState([]),[media,setMedia]=useState([]),[uploadProgress,setUploadProgress]=useState(0),[editingPost,setEditingPost]=useState(null),[editDraft,setEditDraft]=useState(''),[editingComment,setEditingComment]=useState(null),[editCommentDraft,setEditCommentDraft]=useState(''),[feedMode,setFeedMode]=useState('all'),[peopleQuery,setPeopleQuery]=useState(''),[people,setPeople]=useState([]),[peopleSearching,setPeopleSearching]=useState(false),[friends,setFriends]=useState([]),[members,setMembers]=useState([]),[groups,setGroups]=useState([]),[groupName,setGroupName]=useState(''),[creatingGroup,setCreatingGroup]=useState(false),[friendRequests,setFriendRequests]=useState([]),[sentRequests,setSentRequests]=useState([])
 useEffect(()=>{supabase.auth.getUser().then(({data})=>{setUser(data?.user||null);load(data?.user||null);loadPosts()})},[])
 async function loadPosts(){
  setLoadingPosts(true)
  const {data,error}=await supabase.from('social_posts').select('id,author_id,body,media_type,media_url,boutique_id,created_at,media_items,profiles!social_posts_author_id_fkey(display_name,avatar_url)').order('created_at',{ascending:false}).limit(20)
  if(!error){
   setPosts(data||[])
   const ids=(data||[]).map(x=>x.id)
   if(ids.length){
    const [{data:l},{data:cm}]=await Promise.all([
     supabase.from('social_likes').select('post_id,user_id').in('post_id',ids),
     supabase.from('social_comments').select('id,post_id,author_id,body,created_at,profiles!social_comments_author_id_fkey(display_name,avatar_url)').in('post_id',ids).order('created_at',{ascending:true})
    ])
    setLikes(l||[]);setComments(cm||[])
   }else{setLikes([]);setComments([])}
  }else console.error('WakhReek Social feed load error',error)
  setLoadingPosts(false)
 }
 async function load(currentUser=user,showLoader=true){
  if(showLoader)setLoading(true)
  const now=new Date().toISOString()
  const [{data:a},{data:b}]=await Promise.all([
   supabase.from('market_tv_ads').select('id,boutique_id,title,description,media_type,media_url,created_at').eq('status','active').or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`).order('created_at',{ascending:false}).limit(30),
   supabase.from('boutiques').select('id,name,description,logo_url').eq('is_live',true).order('created_at',{ascending:false}).limit(12)
  ])
  setAds(a||[]);setShops(b||[])
  if(currentUser){const [{data:fw},{data:fr},{data:sr},{data:fl}]=await Promise.all([supabase.from('social_follows').select('following_id').eq('follower_id',currentUser.id),supabase.from('friend_requests').select('id,sender_id,created_at,profiles!friend_requests_sender_id_fkey(display_name,avatar_url,country_code)').eq('receiver_id',currentUser.id).eq('status','pending').order('created_at',{ascending:false}),supabase.from('friend_requests').select('id,receiver_id,status').eq('sender_id',currentUser.id).eq('status','pending'),supabase.from('friends').select('friend_id').eq('user_id',currentUser.id)]);setFollows(fw||[]);setFriendRequests(fr||[]);setSentRequests(sr||[]);const friendIds=(fl||[]).map(x=>x.friend_id);if(friendIds.length){const {data:fp}=await supabase.from('profiles').select('id,display_name,avatar_url,country_code').in('id',friendIds).limit(30);setFriends(fp||[])}else setFriends([])}else{setFollows([]);setFriends([]);setFriendRequests([]);setSentRequests([])}
  const {data:ms}=await supabase.from('profiles').select('id,display_name,avatar_url,country_code').order('created_at',{ascending:false}).limit(12);setMembers(ms||[])
  const {data:gs}=await supabase.from('social_groups').select('id,name,description,is_private,owner_id,created_at').order('created_at',{ascending:false}).limit(8);setGroups(gs||[])
  if(showLoader)setLoading(false)
 }

 async function sendFriendRequest(userId){
  if(!user||userId===user.id||friends.some(x=>x.id===userId)||sentRequests.some(x=>x.receiver_id===userId))return
  const {data,error}=await supabase.from('friend_requests').insert({sender_id:user.id,receiver_id:userId,status:'pending'}).select('id,receiver_id,status').single()
  if(!error&&data)setSentRequests(v=>[...v,data]);else if(error)alert(t('socialFriendRequestFailed','Unable to send friend request'))
 }
 async function respondFriendRequest(requestId,accept){
  if(!user)return
  const {error}=await supabase.rpc('respond_friend_request',{request_id:requestId,accept_request:accept})
  if(!error)await load(user);else alert(t('socialFriendResponseFailed','Unable to update friend request'))
 }
 async function createGroup(){
  const name=groupName.trim()
  if(!user||name.length<2||creatingGroup)return
  setCreatingGroup(true)
  const {data,error}=await supabase.from('social_groups').insert({owner_id:user.id,name,is_private:false}).select('id,name,description,is_private,owner_id,created_at').single()
  if(!error&&data){await supabase.from('social_group_members').insert({group_id:data.id,user_id:user.id,role:'owner'});setGroups(v=>[data,...v]);setGroupName('')}
  else alert(t('socialGroupCreateFailed','Unable to create group'))
  setCreatingGroup(false)
 }
 async function searchPeople(e){
  e?.preventDefault()
  const q=peopleQuery.trim()
  if(q.length<2){setPeople([]);return}
  setPeopleSearching(true)
  const safe=q.replace(/[%,()]/g,'')
  const {data}=await supabase.from('profiles').select('id,display_name,avatar_url,country_code').ilike('display_name','%'+safe+'%').limit(12)
  setPeople(data||[]);setPeopleSearching(false)
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
 function startCommentEdit(cm){setEditingComment(cm.id);setEditCommentDraft(cm.body)}
 async function saveCommentEdit(cm){
  const body=editCommentDraft.trim()
  if(!user||cm.author_id!==user.id||!body)return
  const {error}=await supabase.from('social_comments').update({body,updated_at:new Date().toISOString()}).eq('id',cm.id).eq('author_id',user.id)
  if(!error){setComments(v=>v.map(x=>x.id===cm.id?{...x,body}:x));setEditingComment(null);setEditCommentDraft('')}
 }
 async function deleteComment(cm){
  if(!user||cm.author_id!==user.id)return
  if(!window.confirm(t('socialDeleteCommentConfirm','Delete this comment?')))return
  const {error}=await supabase.from('social_comments').delete().eq('id',cm.id).eq('author_id',user.id)
  if(!error)setComments(v=>v.filter(x=>x.id!==cm.id))
 }
 const following=userId=>follows.some(x=>x.following_id===userId)
 async function toggleFollow(userId){
  if(!user){setGate(true);return}
  if(userId===user.id)return
  if(following(userId)){
   const {error}=await supabase.from('social_follows').delete().eq('follower_id',user.id).eq('following_id',userId)
   if(!error){setFollows(v=>v.filter(x=>x.following_id!==userId));setFriends(v=>v.filter(x=>x.id!==userId))}
  }else{
   const {error}=await supabase.from('social_follows').insert({follower_id:user.id,following_id:userId})
   if(!error){setFollows(v=>[...v,{following_id:userId}]);const person=members.find(x=>x.id===userId)||people.find(x=>x.id===userId);if(person)setFriends(v=>v.some(x=>x.id===userId)?v:[...v,person])}
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
 function startEdit(post){setEditingPost(post.id);setEditDraft(post.body||'')}
 async function saveEdit(post){
  const body=editDraft.trim()
  if(!user||post.author_id!==user.id||(!body&&!post.media_url))return
  const {error}=await supabase.from('social_posts').update({body:body||null,updated_at:new Date().toISOString()}).eq('id',post.id).eq('author_id',user.id)
  if(!error){setEditingPost(null);setEditDraft('');await load()}
 }
 async function deletePost(post){
  if(!user||post.author_id!==user.id)return
  if(!window.confirm(t('socialDeleteConfirm','Delete this post?')))return
  const {error}=await supabase.from('social_posts').delete().eq('id',post.id).eq('author_id',user.id)
  if(error)return
  if(post.media_url){
   try{const u=new URL(post.media_url);const marker='/storage/v1/object/public/social-media/';const i=u.pathname.indexOf(marker);if(i>=0){const path=decodeURIComponent(u.pathname.slice(i+marker.length));if(path.startsWith(user.id+'/'))await supabase.storage.from('social-media').remove([path])}}catch{}
  }
  setPosts(v=>v.filter(x=>x.id!==post.id));setLikes(v=>v.filter(x=>x.post_id!==post.id));setComments(v=>v.filter(x=>x.post_id!==post.id))
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
  if((!body&&!media.length)||posting)return
  setPosting(true);setUploadProgress(0)
  const allowed=['image/jpeg','image/png','image/webp','video/mp4','video/webm']
  if(media.some(file=>!allowed.includes(file.type)||file.size>52428800)){alert(t('socialMediaInvalid','Unsupported file or file too large'));setPosting(false);return}
  const uploaded=[]
  for(let i=0;i<media.length;i++){
   const file=media[i],type=file.type.startsWith('video/')?'video':'image',ext=(file.name.split('.').pop()||'bin').toLowerCase(),path=user.id+'/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext
   const {error}=await supabase.storage.from('social-media').upload(path,file,{contentType:file.type,upsert:false})
   if(error){alert(t('socialMediaUploadFailed','Upload failed'));setPosting(false);return}
   uploaded.push({media_type:type,media_url:supabase.storage.from('social-media').getPublicUrl(path).data.publicUrl,sort_order:i})
   setUploadProgress(Math.round(((i+1)/media.length)*70))
  }
  const first=uploaded[0]||null
  const {data:post,error}=await supabase.rpc('create_social_post',{p_body:body||null,p_media_type:first?.media_type||null,p_media_url:first?.media_url||null,p_group_id:null,p_media_items:uploaded})
  if(!error&&post){
   setUploadProgress(100);setDraft('');setMedia([])
   await loadPosts()
   setPosting(false);setUploadProgress(0)
   alert(t('socialPublishSuccess','Publication publiée avec succès'))
   return
  }else{console.error('WakhReek Social publish error',error);alert(t('socialPublishFailed','Publication unavailable')+(error?.message?' — '+error.message:''))}
  setPosting(false);setUploadProgress(0)
 }
 const visiblePosts=feedMode==='following'&&user?posts.filter(p=>p.author_id===user.id||following(p.author_id)):posts
 return <AppShell><main className="social">
  <section className="socialBrandBar"><div className="socialBrandTitle"><img src="/wakhreek-192-v2.png" alt="WakhReek" /><strong>Social</strong></div><div className="socialBrandSearch">🔎 <span>{t('socialSearchPeople','Search people…')}</span></div></section>
  <nav className="socialSectionNav" aria-label="WakhReek Social"><a href="#social-feed">Accueil</a><a href="#friends">{t('socialFriends','Friends')}</a><a href="#groups">{t('socialGroups','Groups')}</a><a href="#events">{t('socialEvents','Events')}</a><a href="#discover">{t('socialFeedAll','Discover')}</a></nav>
  <div className="socialgrid" id="social-feed"><aside className="leftcol"><nav className="socialmenu" aria-label="Social"><Link href="/social" className="active">👥 <b>Social</b></Link><a href="#friends">🤝 <b>{t('socialFriends','Friends')}</b></a><a href="#groups">👥 <b>{t('socialGroups','Groups')}</b></a><a href="#events">📅 <b>{t('socialEvents','Events')}</b></a></nav><form className="peoplesearch" onSubmit={searchPeople}><input value={peopleQuery} onChange={e=>setPeopleQuery(e.target.value)} placeholder={t('socialSearchPeople','Search people…')} aria-label={t('socialSearchPeople','Search people…')}/><button type="submit">{t('socialSearch','Search')}</button></form>
  {(peopleSearching||people.length>0)&&<section className="peopleresults">{peopleSearching?<p>{t('loading','Loading…')}</p>:people.map(person=><div className="person" key={person.id}>{person.avatar_url?<img src={person.avatar_url} alt=""/>:<span className="personavatar">WR</span>}<Link href={'/social/profile/'+person.id} className="personinfo"><b data-user-content data-no-translate>{person.display_name||'WakhReek'}</b>{person.country_code&&<small>{person.country_code}</small>}</Link>{user&&person.id!==user.id&&<button type="button" className={following(person.id)?'following':''} onClick={()=>toggleFollow(person.id)}>{following(person.id)?t('socialFollowing','Following'):t('socialFollow','Follow')}</button>}</div>)}</section>}{user&&<section className="members"><h2>{t('socialMembers','Members')}</h2>{members.filter(person=>person.id!==user.id).length?members.filter(person=>person.id!==user.id).map(person=><div className="person" key={person.id}>{person.avatar_url?<img src={person.avatar_url} alt=""/>:<span className="personavatar">WR</span>}<Link href={'/social/profile/'+person.id} className="personinfo"><b data-user-content data-no-translate>{person.display_name||'WakhReek'}</b>{person.country_code&&<small>{person.country_code}</small>}</Link><button type="button" className={following(person.id)?'following':''} onClick={()=>toggleFollow(person.id)}>{following(person.id)?t('socialFollowing','Following'):t('socialFollow','Follow')}</button>{!friends.some(x=>x.id===person.id)&&<button type="button" disabled={sentRequests.some(x=>x.receiver_id===person.id)} onClick={()=>sendFriendRequest(person.id)}>{sentRequests.some(x=>x.receiver_id===person.id)?'✓': '🤝'}</button>}</div>):<p>{t('socialNoMembers','No members yet')}</p>}</section>}{user&&<section className="friends" id="friends"><h2>{t('socialFriends','Friends')}</h2>{friendRequests.length>0&&<div className="friendRequests"><b>{t('socialFriendRequests','Friend requests')} ({friendRequests.length})</b>{friendRequests.map(r=><div className="friendRequest" key={r.id}>{r.profiles?.avatar_url?<img src={r.profiles.avatar_url} alt=""/>:<span className="personavatar">WR</span>}<Link href={'/social/profile/'+r.sender_id}><span data-user-content data-no-translate>{r.profiles?.display_name||'WakhReek'}</span></Link><button onClick={()=>respondFriendRequest(r.id,true)}>✓</button><button className="reject" onClick={()=>respondFriendRequest(r.id,false)}>×</button></div>)}</div>}{friends.length?friends.map(friend=><Link href={'/social/profile/'+friend.id} className="friend" key={friend.id}>{friend.avatar_url?<img src={friend.avatar_url} alt=""/>:<span className="personavatar">WR</span>}<span><b data-user-content data-no-translate>{friend.display_name||'WakhReek'}</b>{friend.country_code&&<small>{friend.country_code}</small>}</span></Link>):<p>{t('socialNoFriends','No friends yet')}</p>}</section>}<section className="groups" id="groups"><h2>{t('socialGroups','Groups')}</h2>{user&&<div className="groupcreate"><input value={groupName} maxLength={100} onChange={e=>setGroupName(e.target.value)} placeholder={t('socialGroupName','Group name')}/><button disabled={groupName.trim().length<2||creatingGroup} onClick={createGroup}>＋</button></div>}{groups.length?groups.map(g=><Link href={'/social/groups/'+g.id} className="groupitem" key={g.id}><span>👥</span><b data-user-content data-no-translate>{g.name}</b></Link>):<p>{t('socialNoGroups','No groups yet')}</p>}</section><section className="events" id="events"><h2>📅 {t('socialEvents','Events')}</h2><p>{t('socialEventsSoon','Events coming soon')}</p></section></aside><section className="centercol">
  {user&&<section className="composer"><textarea value={draft} maxLength={3000} onChange={e=>setDraft(e.target.value)} placeholder={t('socialPlaceholder')} />{media.length>0&&<div className="mediaPreview">{media.map((file,i)=>{const url=URL.createObjectURL(file);return <div className="previewItem" key={file.name+i}>{file.type.startsWith('video/')?<video src={url} muted/>:<img src={url} alt=""/>}<button type="button" onClick={()=>setMedia(v=>v.filter((_,j)=>j!==i))}>×</button></div>})}</div>}{posting&&media.length>0&&<div className="uploadTrack"><span style={{width:uploadProgress+'%'}}></span></div>}<div className="composerActions"><label className="mediaBtn">＋ {t('socialAddMedia','Photo / Video')}<input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={e=>setMedia(v=>[...v,...Array.from(e.target.files||[])].slice(0,10))} /></label><small className="charCount">{draft.length}/3000</small><button className="publishBtn" disabled={(!draft.trim()&&!media.length)||posting} onClick={publish}>{posting?t('socialPublishing'):t('socialPublish')}</button></div></section>}
  {user&&<div className="feedtabs"><button className={feedMode==='all'?'active':''} onClick={()=>setFeedMode('all')}>{t('socialFeedAll','Discover')}</button><button className={feedMode==='following'?'active':''} onClick={()=>setFeedMode('following')}>{t('socialFeedFollowing','Following')}</button></div>}
  {loadingPosts?<div className="empty">{t('loading')}</div>:<>
   {visiblePosts.length>0&&<section className="feed">{visiblePosts.map(post=><article className="post" id={'post-'+post.id} key={post.id}>
    <div className="posttop">{post.profiles?.avatar_url?<img className="useravatar" src={post.profiles.avatar_url} alt="" />:<div className="avatar">WR</div>}<div><div className="authorline"><Link className="authorlink" href={'/social/profile/'+post.author_id} data-user-content data-no-translate>{post.profiles?.display_name||'WakhReek'}</Link>{(!user||post.author_id!==user.id)&&<button className={following(post.author_id)?'following':''} onClick={()=>toggleFollow(post.author_id)}>{following(post.author_id)?t('socialFollowing','Following'):t('socialFollow','Follow')}</button>}</div><small>{new Date(post.created_at).toLocaleString()}</small></div></div>
    {editingPost===post.id?<div className="editbox"><textarea value={editDraft} maxLength={3000} onChange={e=>setEditDraft(e.target.value)} /><div><button onClick={()=>{setEditingPost(null);setEditDraft('')}}>{t('cancel','Cancel')}</button><button onClick={()=>saveEdit(post)}>{t('save','Save')}</button></div></div>:post.body&&<p className="socialbody" data-user-content data-no-translate>{post.body}</p>}{post.author_id===user?.id&&editingPost!==post.id&&<div className="owneractions"><button onClick={()=>startEdit(post)}>{t('socialEdit','Edit')}</button><button onClick={()=>deletePost(post)}>{t('socialDelete','Delete')}</button></div>}{(post.media_items?.length?post.media_items:[post.media_url?{media_type:post.media_type,media_url:post.media_url,sort_order:0}:null].filter(Boolean)).length>0&&<div className="postMediaGrid">{(post.media_items?.length?post.media_items:[{media_type:post.media_type,media_url:post.media_url,sort_order:0}]).sort((a,b)=>a.sort_order-b.sort_order).map((m,i)=>m.media_type==='video'?<video key={i} className="socialmedia" src={m.media_url} controls playsInline preload="metadata"/>:<img key={i} className="socialmedia" src={m.media_url} alt="" />)}</div>}
    <div className="postactions"><button className={likedByMe(post.id)?'liked':''} onClick={()=>toggleLike(post.id)}>👍 {t('socialLike').replace(/^♡\s*/,'')} {likeCount(post.id)>0&&<span>{likeCount(post.id)}</span>}</button><button className={likedByMe(post.id)?'liked':''} onClick={()=>toggleLike(post.id)}>❤️ {t('socialReactLove','J’adore')}</button><button onClick={()=>openComments(post.id)}>💬 {t('socialComment')} {postComments(post.id).length>0&&<span>{postComments(post.id).length}</span>}</button><button onClick={()=>sharePost(post)}>↗ {t('socialShare')}</button></div>
    {commentPost===post.id&&<div className="comments">{postComments(post.id).map(cm=><div className="comment" key={cm.id}><b data-user-content data-no-translate>{cm.profiles?.display_name||'WakhReek'}</b>{editingComment===cm.id?<div className="commentedit"><textarea value={editCommentDraft} maxLength={2000} onChange={e=>setEditCommentDraft(e.target.value)} /><div><button onClick={()=>{setEditingComment(null);setEditCommentDraft('')}}>{t('cancel','Cancel')}</button><button disabled={!editCommentDraft.trim()} onClick={()=>saveCommentEdit(cm)}>{t('save','Save')}</button></div></div>:<><p data-user-content data-no-translate>{cm.body}</p>{cm.author_id===user?.id&&<div className="commentactions"><button onClick={()=>startCommentEdit(cm)}>{t('socialEdit','Edit')}</button><button onClick={()=>deleteComment(cm)}>{t('socialDelete','Delete')}</button></div>}</>}</div>)}<div className="commentbox"><textarea value={commentDraft} maxLength={2000} onChange={e=>setCommentDraft(e.target.value)} placeholder={t('socialCommentPlaceholder','Write a comment…')} /><button disabled={!commentDraft.trim()||commenting} onClick={()=>addComment(post.id)}>{commenting?t('socialPublishing'):t('socialCommentSend','Send')}</button></div></div>}
   </article>)}</section>}
   {ads.length>0&&<section className="feed sponsored">{ads.slice(0,5).map(ad=><article className="post" key={ad.id}>
    <div className="posttop"><div className="avatar">WR</div><div><b>WakhReek</b><small>{t('socialSponsored')}</small></div></div>
    {ad.description&&<p className="caption" data-user-content data-no-translate>{ad.description}</p>}
    {ad.media_type==='video'?<video src={ad.media_url} controls playsInline preload="metadata"/>:<img src={ad.media_url} alt={ad.title}/>}
    <div className="body"><h2 data-user-content data-no-translate>{ad.title}</h2><div className="actions"><button onClick={locked}>{t('socialLike')}</button><button onClick={locked}>{t('socialComment')}</button><button onClick={locked}>{t('socialShare')}</button></div>{ad.boutique_id&&<button className="shopbtn" onClick={locked}>{t('socialViewShop')}</button>}</div>
   </article>)}</section>}
   {ads.length===0&&<section className="empty"><div className="play">▶</div><h2>{t('socialArrives')}</h2><p>{t('socialFirst')}</p></section>}

  </>}</section><aside className="rightcol">{shops.length>0&&<section className="shops"><h2>{t('socialShops')}</h2><div className="shopgrid">{shops.slice(0,6).map(s=><button className="shop" key={s.id} onClick={locked}>{s.logo_url?<img src={s.logo_url} alt={s.name}/>:<span className="placeholder">WR</span>}<span><b data-user-content data-no-translate>{s.name}</b><small>{t('socialSee')}</small></span></button>)}</div></section>}</aside></div>
 </main><style jsx>{`
 .social{max-width:1500px;margin:auto;padding:14px 18px 50px;color:#172033}.socialBrandBar{margin:-14px -18px 0;background:linear-gradient(90deg,#ff6b00,#ff8500);min-height:82px;padding:12px 28px;display:flex;align-items:center;justify-content:space-between;gap:22px}.socialBrandTitle{display:flex;align-items:center;gap:14px;color:#fff;font-size:30px}.socialBrandTitle img{width:58px;height:58px;object-fit:contain;border-radius:13px;background:#fff}.socialBrandSearch{flex:1;max-width:820px;height:54px;border-radius:15px;background:#fff;display:flex;align-items:center;gap:10px;padding:0 20px;color:#667085;font-size:18px}.socialSectionNav{margin:0 -18px 18px;min-height:70px;background:linear-gradient(90deg,#0964d9,#087af0);display:flex;align-items:center;justify-content:center;gap:18px;padding:8px 24px}.socialSectionNav a{color:#fff;text-decoration:none;font-weight:900;font-size:17px;padding:12px 18px;border-radius:12px}.socialSectionNav a:hover{background:#ff8500}.head{background:linear-gradient(135deg,#071a35,#0b65c8);color:#fff;border-radius:22px;padding:26px;display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-weight:900;color:#ffad3d}.head h1{margin:7px 0;font-size:30px}.head p{margin:0;opacity:.85}.head button,.welcome button,.locked button{border:0;border-radius:12px;background:#ff9818;color:#fff;font-weight:900;padding:12px 16px;cursor:pointer}.welcome{margin:15px 0;background:linear-gradient(135deg,#f8fbff,#eef6ff);border:2px solid #0b65c8;border-radius:18px;padding:18px;display:flex;align-items:center;justify-content:space-between;gap:15px;box-shadow:0 5px 18px rgba(11,101,200,.08)}.welcome b{color:#0b4f9c;font-size:18px}.welcome p{margin:5px 0 0;color:#52647a}.friendRequests{margin:8px 0 12px;padding:10px;border-radius:12px;background:#eef6ff}.friendRequest{display:grid;grid-template-columns:34px 1fr auto auto;align-items:center;gap:7px;margin-top:8px}.friendRequest img,.friendRequest .personavatar{width:34px;height:34px;border-radius:50%;object-fit:cover}.friendRequest a{text-decoration:none;color:#172033;font-weight:800;overflow:hidden}.friendRequest button{border:0;border-radius:8px;background:#087af0;color:#fff;font-weight:900;padding:6px 9px;cursor:pointer}.friendRequest button.reject{background:#eef1f5;color:#667085}.composer{margin:0 0 15px;background:#fff;border:1px solid #dce5ef;border-radius:16px;padding:14px;min-width:0}.composer textarea{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:110px;resize:vertical;border:1px solid #dce5ef;border-radius:12px;padding:14px;font:inherit;box-sizing:border-box;line-height:1.45}.composer>.composerActions{display:flex!important;align-items:center;gap:12px;margin-top:10px;width:100%;flex-wrap:wrap}.mediaBtn{flex:0 0 auto}.charCount{margin-left:auto;white-space:nowrap}.publishBtn{flex:0 0 auto;min-width:100px}.composer small{color:#667085}.mediaBtn{border:1px solid #dce5ef;border-radius:10px;padding:9px 11px;font-weight:800;cursor:pointer}.mediaBtn input{display:none}.mediaPreview{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:10px}.previewItem{position:relative;height:130px;border-radius:12px;overflow:hidden;background:#eef1f5}.previewItem img,.previewItem video{width:100%;height:100%;object-fit:cover}.previewItem button{position:absolute;right:6px;top:6px;width:28px;height:28px;padding:0!important;border-radius:50%!important;background:rgba(0,0,0,.7)!important}.uploadTrack{height:6px;background:#e8eef5;border-radius:99px;overflow:hidden;margin-top:10px}.uploadTrack span{display:block;height:100%;background:#087af0;transition:width .2s}.postMediaGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:3px;background:#fff}.postMediaGrid .socialmedia{height:100%;min-height:240px;max-height:520px;object-fit:cover}.selectedmedia{display:flex;justify-content:space-between;align-items:center;background:#f5f7fa;border-radius:10px;padding:8px 10px;margin-top:8px;gap:10px;overflow:hidden}.selectedmedia span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.selectedmedia button{border:0!important;background:transparent!important;color:#667085!important;padding:2px 6px!important;font-size:20px}.owneractions{display:flex;gap:8px;padding:0 14px 10px}.owneractions button,.editbox button{border:1px solid #dce5ef;background:#fff;border-radius:9px;padding:7px 10px;font-weight:700;cursor:pointer}.editbox{padding:0 14px 12px}.editbox textarea{width:100%;min-height:80px;box-sizing:border-box;border:1px solid #dce5ef;border-radius:10px;padding:10px;font:inherit}.editbox>div{display:flex;justify-content:flex-end;gap:8px;margin-top:7px}.socialmedia{width:100%;max-height:520px;object-fit:cover;background:#050505}.composer button{border:0;border-radius:10px;background:#087af0;color:#fff;font-weight:900;padding:10px 18px;cursor:pointer}.composer button:disabled{opacity:.45;cursor:not-allowed}.socialgrid{display:grid;grid-template-columns:minmax(150px,190px) minmax(0,1fr) minmax(170px,210px);gap:14px;align-items:start}.leftcol,.rightcol{position:sticky;top:18px;align-self:start}.leftcol{background:#f8fbff;border:1px solid #e1eaf4;border-radius:16px;padding:12px}.rightcol{background:#f8fbff;border:1px solid #e1eaf4;border-radius:16px;padding:12px}.centercol{min-width:0;width:100%}.socialmenu{display:grid;gap:4px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e1eaf4}.socialmenu a{display:flex;align-items:center;gap:9px;padding:10px;border-radius:10px;text-decoration:none;color:#44505f}.socialmenu a:hover,.socialmenu a.active{background:#eef6ff;color:#087af0}.events{margin-top:14px;padding-top:12px;border-top:1px solid #e1eaf4}.events h2{font-size:16px;margin:0 0 8px}.events p{font-size:13px;color:#667085;margin:0}.peoplesearch{display:flex;gap:8px;margin:0}.peoplesearch input{flex:1;min-width:0;border:1px solid #dce5ef;border-radius:12px;padding:11px 13px;background:#fff}.peoplesearch button,.person button{border:0;border-radius:12px;padding:9px 13px;background:#087af0;color:#fff;font-weight:800;cursor:pointer}.friends{margin-top:14px;padding-top:12px;border-top:1px solid #e1eaf4}.friends h2{font-size:16px;margin:0 0 9px}.friends>p{font-size:13px;color:#667085;margin:5px 0}.friend{display:flex;align-items:center;gap:9px;padding:8px 4px;text-decoration:none;color:inherit;border-radius:10px}.friend:hover{background:#eef5fc}.friend img,.friend .personavatar{width:38px;height:38px;border-radius:50%;object-fit:cover}.friend>span:last-child{display:grid;min-width:0}.friend b{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.friend small{font-size:11px;color:#667085}.groups{margin-top:14px;padding-top:12px;border-top:1px solid #e1eaf4}.groups h2{font-size:16px;margin:0 0 9px}.groups>p{font-size:13px;color:#667085}.groupcreate{display:flex;gap:6px;margin-bottom:9px}.groupcreate input{min-width:0;width:100%;border:1px solid #dce5ef;border-radius:9px;padding:8px}.groupcreate button{border:0;border-radius:9px;background:#087af0;color:#fff;font-weight:900;padding:0 10px}.groupcreate button:disabled{opacity:.45}.groupitem{display:flex;align-items:center;gap:7px;padding:8px 4px;text-decoration:none;color:inherit;border-radius:9px}.groupitem:hover{background:#eef5fc}.groupitem b{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.peopleresults{background:#fff;border:1px solid #e5eaf0;border-radius:16px;padding:8px;margin-bottom:14px}.person{display:flex;align-items:center;gap:10px;padding:9px 7px;border-bottom:1px solid #eef2f6}.person:last-child{border-bottom:0}.person img,.personavatar{width:42px;height:42px;border-radius:50%;object-fit:cover}.personavatar{display:grid;place-items:center;background:#087af0;color:#fff;font-size:12px;font-weight:900}.personinfo{display:flex;flex:1;min-width:0;flex-direction:column;color:inherit;text-decoration:none}.personinfo small{color:#667085}.person button.following{background:#eef4fb;color:#0b65c8}.feedtabs{display:flex;gap:8px;margin:0 0 14px}.feedtabs button{border:1px solid #dce5ef;background:#fff;border-radius:999px;padding:9px 15px;font-weight:800;cursor:pointer}.feedtabs button.active{background:#087af0;color:#fff;border-color:#0b65c8}.feed{display:grid;gap:16px}.sponsored{margin-top:16px}.post{background:#fff;border:1px solid #dce5ef;border-radius:16px;overflow:hidden;box-shadow:0 3px 14px rgba(20,45,80,.06)}.posttop{display:flex;gap:10px;align-items:center;padding:14px}.avatar,.logo{display:grid;place-items:center;background:#087af0;color:#fff;font-weight:900}.avatar,.useravatar{width:42px;height:42px;border-radius:50%}.useravatar{object-fit:cover}.socialbody{padding:0 14px 16px;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.posttop>div:last-child{display:grid;flex:1}.authorlink{font-weight:800;color:inherit;text-decoration:none}.authorlink:hover{text-decoration:underline}.authorline{display:flex;align-items:center;justify-content:space-between;gap:10px}.authorline button{border:1px solid #0b7fe5;background:#fff;color:#0b7fe5;border-radius:999px;padding:5px 10px;font-weight:800;cursor:pointer}.authorline button.following{background:#087af0;color:#fff}.posttop small{color:#667085}.caption{padding:0 14px;margin:0 0 12px}.post>video,.post>img{width:100%;max-height:520px;object-fit:cover;background:#050505}.body{padding:14px}.body h2{margin:0 0 12px}.postactions,.actions{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #edf1f5;border-bottom:1px solid #edf1f5}.postactions button,.actions button{border:0;background:#fff;padding:13px 6px;border-right:1px solid #edf1f5;font-weight:700;cursor:pointer;color:#4b5565}.postactions{grid-template-columns:repeat(3,1fr);border-top:1px solid #edf1f5}.postactions button:last-child,.actions button:last-child{border-right:0}.comments{padding:12px 14px;border-top:1px solid #edf1f5}.comment{background:#f5f7fa;border-radius:12px;padding:9px 11px;margin-bottom:8px}.comment p{margin:3px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.commentactions{display:flex;gap:7px;margin-top:5px}.commentactions button,.commentedit button{border:0;background:transparent;color:#667085;font-weight:700;cursor:pointer;padding:2px 0}.commentedit textarea{width:100%;box-sizing:border-box;min-height:60px;border:1px solid #dce5ef;border-radius:9px;padding:8px;font:inherit;margin-top:6px}.commentedit>div{display:flex;justify-content:flex-end;gap:10px}.commentbox{display:flex;gap:8px;align-items:flex-end}.commentbox textarea{flex:1;min-height:44px;max-height:120px;resize:vertical;border:1px solid #dce5ef;border-radius:10px;padding:9px;font:inherit}.commentbox button{border:0;border-radius:10px;background:#087af0;color:#fff;font-weight:800;padding:10px 13px}.commentbox button:disabled{opacity:.45}.postactions .liked{color:#d92d20}.postactions span{font-weight:900}.shopbtn{margin-top:12px;width:100%;border:0;border-radius:11px;padding:11px;background:#087af0;color:#fff;font-weight:800}.shops{margin-top:0}.shops h2{font-size:18px;margin:2px 0 12px}.rightcol .shopgrid{grid-template-columns:1fr}.rightcol .shop{width:100%}.shopgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.shop{border:1px solid #dce5ef;background:#fff;border-radius:14px;padding:10px;display:flex;align-items:center;gap:10px;text-align:left}.shop img,.placeholder{width:50px;height:50px;border-radius:12px;object-fit:cover}.placeholder{display:grid;place-items:center;background:#087af0;color:#fff;font-weight:900}.shop>span:last-child{display:grid}.shop small{color:#667085}.locked,.empty{text-align:center;margin-top:18px;padding:34px 20px;background:#fff;border:1px dashed #bdcad8;border-radius:18px}.locked>span{font-size:34px}.locked h2{margin:8px}.locked p,.empty p{color:#667085}.play{margin:auto;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#087af0;color:#fff}.overlay{position:fixed;inset:0;background:rgba(4,12,24,.72);z-index:9999;display:grid;place-items:center;padding:16px}.gate{width:min(480px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;padding:24px;position:relative;text-align:center}.close{position:absolute;right:12px;top:9px;border:0;background:transparent;font-size:28px;cursor:pointer}.logo{width:54px;height:54px;border-radius:15px;margin:auto;font-size:28px}.gate h2{margin:10px 0 6px}.gate p{color:#667085}.gate video{width:100%;border-radius:13px;background:#000;max-height:280px}.download,.account{width:100%;border:0;border-radius:12px;padding:13px;font-weight:900;cursor:pointer;margin-top:10px}.download{background:#ff9818;color:#fff}.account{background:#087af0;color:#fff}
 @media(max-width:900px){.socialgrid{grid-template-columns:180px minmax(0,1fr)}.rightcol{grid-column:1/-1;position:static}.rightcol .shopgrid{grid-template-columns:repeat(2,1fr)}} @media(max-width:760px){.socialgrid{display:flex;flex-direction:column}.leftcol,.rightcol{position:static;width:100%}.centercol{width:100%}.postactions{grid-template-columns:repeat(2,1fr)}} @media(max-width:650px){.social{padding:8px}.composer{padding:12px}.composer textarea{display:block;width:100%;min-height:110px}.composer>.composerActions{grid-template-columns:1fr auto;gap:10px}.mediaBtn{min-width:0;white-space:normal;line-height:1.2}.charCount{grid-column:1/2;grid-row:2;justify-self:start}.publishBtn{grid-column:2;grid-row:1/3;align-self:stretch;min-width:92px}.head{display:block;padding:20px}.head h1{font-size:25px}.head button{margin-top:15px}.welcome{display:block}.welcome button{margin-top:12px}.shopgrid{grid-template-columns:1fr}.actions button{font-size:12px}}
 `}</style></AppShell>
}
