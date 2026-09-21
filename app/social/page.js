'use client'

import {useCallback,useEffect,useState} from 'react'
import Link from 'next/link'
import AppShell from '../../components/AppShell'
import {supabase} from '../../lib/supabase'

export default function SocialPage(){
  const [user,setUser]=useState(null)
  const [posts,setPosts]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [draft,setDraft]=useState('')
  const [publishing,setPublishing]=useState(false)
  const [media,setMedia]=useState([])
  const [uploadProgress,setUploadProgress]=useState(0)
  const [likes,setLikes]=useState([])
  const [comments,setComments]=useState([])
  const [openComments,setOpenComments]=useState(null)
  const [commentDraft,setCommentDraft]=useState('')
  const [people,setPeople]=useState([])
  const [friends,setFriends]=useState([])
  const [requests,setRequests]=useState([])
  const [sentRequests,setSentRequests]=useState([])

  const loadPosts=useCallback(async()=>{
    setLoading(true)
    setError('')

    const {data,error:postsError}=await supabase
      .from('social_posts')
      .select('id,author_id,body,media_type,media_url,media_items,created_at')
      .is('group_id',null)
      .order('created_at',{ascending:false})
      .limit(30)

    if(postsError){
      setPosts([])
      setError(postsError.message||'Impossible de charger le fil.')
      setLoading(false)
      return
    }

    const rows=data||[]
    const authorIds=[...new Set(rows.map(post=>post.author_id).filter(Boolean))]
    let profiles={}

    if(authorIds.length){
      const {data:profileRows}=await supabase
        .from('profiles')
        .select('id,display_name,avatar_url')
        .in('id',authorIds)
      profiles=Object.fromEntries((profileRows||[]).map(profile=>[profile.id,profile]))
    }

    setPosts(rows.map(post=>({...post,profile:profiles[post.author_id]||null})))

    const ids=rows.map(post=>post.id)
    if(ids.length){
      const [{data:likeRows},{data:commentRows}]=await Promise.all([
        supabase.from('social_likes').select('post_id,user_id').in('post_id',ids),
        supabase.from('social_comments').select('id,post_id,author_id,body,created_at').in('post_id',ids).order('created_at',{ascending:true})
      ])
      setLikes(likeRows||[])
      setComments(commentRows||[])
    }else{
      setLikes([])
      setComments([])
    }
    setLoading(false)
  },[])

  useEffect(()=>{
    let active=true
    supabase.auth.getUser().then(({data})=>{
      if(active){setUser(data?.user||null);if(data?.user)loadPeopleAndFriends(data.user)}
    })
    loadPosts()
    return()=>{active=false}
  },[loadPosts])

  async function loadPeopleAndFriends(currentUser){
    const [{data:peopleRows},{data:friendRows},{data:requestRows},{data:sentRows}]=await Promise.all([
      supabase.from('profiles').select('id,display_name,avatar_url,country_code').neq('id',currentUser.id).order('created_at',{ascending:false}).limit(12),
      supabase.from('friends').select('friend_id').eq('user_id',currentUser.id),
      supabase.from('friend_requests').select('id,sender_id,status').eq('receiver_id',currentUser.id).eq('status','pending'),
      supabase.from('friend_requests').select('id,receiver_id,status').eq('sender_id',currentUser.id).eq('status','pending')
    ])
    const friendIds=(friendRows||[]).map(row=>row.friend_id)
    let friendProfiles=[]
    if(friendIds.length){
      const {data}=await supabase.from('profiles').select('id,display_name,avatar_url,country_code').in('id',friendIds)
      friendProfiles=data||[]
    }
    setPeople(peopleRows||[])
    setFriends(friendProfiles)
    setRequests(requestRows||[])
    setSentRequests(sentRows||[])
  }

  async function sendFriendRequest(personId){
    if(!user||personId===user.id||friends.some(friend=>friend.id===personId)||sentRequests.some(request=>request.receiver_id===personId))return
    const {data,error:requestError}=await supabase.from('friend_requests').insert({sender_id:user.id,receiver_id:personId,status:'pending'}).select('id,receiver_id,status').single()
    if(requestError){setError(requestError.message);return}
    setSentRequests(current=>[...current,data])
  }

  async function respondFriendRequest(requestId,accept){
    if(!user)return
    const {error:requestError}=await supabase.rpc('respond_friend_request',{request_id:requestId,accept_request:accept})
    if(requestError){setError(requestError.message);return}
    await loadPeopleAndFriends(user)
  }

  async function publish(){
    const body=draft.trim()
    if(!user||(!body&&!media.length)||publishing)return

    setPublishing(true)
    setError('')
    setUploadProgress(0)

    const allowed=['image/jpeg','image/png','image/webp','video/mp4','video/webm']
    if(media.some(file=>!allowed.includes(file.type)||file.size>52428800)){
      setError('Format non supporté ou fichier supérieur à 50 Mo.')
      setPublishing(false)
      return
    }

    const uploaded=[]
    for(let i=0;i<media.length;i++){
      const file=media[i]
      const type=file.type.startsWith('video/')?'video':'image'
      const ext=(file.name.split('.').pop()||'bin').toLowerCase()
      const path=user.id+'/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext
      const {error:uploadError}=await supabase.storage.from('social-media').upload(path,file,{contentType:file.type,upsert:false})

      if(uploadError){
        setError('Envoi du média impossible : '+uploadError.message)
        setPublishing(false)
        setUploadProgress(0)
        return
      }

      uploaded.push({
        media_type:type,
        media_url:supabase.storage.from('social-media').getPublicUrl(path).data.publicUrl,
        sort_order:i
      })
      setUploadProgress(Math.round(((i+1)/Math.max(media.length,1))*75))
    }

    const first=uploaded[0]||null
    const {error:publishError}=await supabase.rpc('create_social_post',{
      p_body:body||null,
      p_media_type:first?.media_type||null,
      p_media_url:first?.media_url||null,
      p_group_id:null,
      p_media_items:uploaded
    })

    if(publishError){
      setError(publishError.message||'Publication impossible.')
      setPublishing(false)
      setUploadProgress(0)
      return
    }

    setUploadProgress(100)
    setDraft('')
    setMedia([])
    await loadPosts()
    setPublishing(false)
    setUploadProgress(0)
  }

  function liked(postId){
    return !!user&&likes.some(item=>item.post_id===postId&&item.user_id===user.id)
  }

  async function toggleLike(postId){
    if(!user)return
    if(liked(postId)){
      const {error:likeError}=await supabase.from('social_likes').delete().eq('post_id',postId).eq('user_id',user.id)
      if(!likeError)setLikes(current=>current.filter(item=>!(item.post_id===postId&&item.user_id===user.id)))
    }else{
      const {error:likeError}=await supabase.from('social_likes').insert({post_id:postId,user_id:user.id})
      if(!likeError)setLikes(current=>[...current,{post_id:postId,user_id:user.id}])
    }
  }

  async function addComment(postId){
    const body=commentDraft.trim()
    if(!user||!body)return
    const {data,error:commentError}=await supabase.from('social_comments').insert({post_id:postId,author_id:user.id,body}).select('id,post_id,author_id,body,created_at').single()
    if(commentError){setError(commentError.message);return}
    setComments(current=>[...current,data])
    setCommentDraft('')
  }

  async function sharePost(post){
    const url=window.location.origin+'/social#post-'+post.id
    try{
      if(navigator.share)await navigator.share({title:'WakhReek Social',text:(post.body||'WakhReek Social').slice(0,180),url})
      else{
        await navigator.clipboard.writeText(url)
        alert('Lien copié')
      }
    }catch(error){
      if(error?.name!=='AbortError')setError('Partage indisponible.')
    }
  }

  function mediaFor(post){
    if(Array.isArray(post.media_items)&&post.media_items.length)return post.media_items
    if(post.media_url)return [{media_type:post.media_type,media_url:post.media_url,sort_order:0}]
    return []
  }

  return <AppShell>
    <main className="socialClean">
      <section className="socialBrandBar">
        <div className="socialBrandTitle">
          <img src="/wakhreek-192-v2.png" alt="WakhReek"/>
          <strong>Social</strong>
        </div>
        <div className="socialBrandSearch">🔎 <span>Rechercher sur WakhReek</span></div>
      </section>

      <nav className="socialSectionNav" aria-label="WakhReek Social">
        <Link href="/social">Accueil</Link>
        <span>Amis</span>
        <span>Groupes</span>
        <span>Événements</span>
        <span>Découvrir</span>
      </nav>

      <div className="socialCleanLayout">
        <aside className="socialCleanLeft">
          <Link className="active" href="/social">🏠 Accueil</Link>
          {user&&<Link href={'/social/profile/'+user.id}>👤 Mon profil</Link>}
          <a href="#friends">🤝 Amis {requests.length>0&&<b className="requestBadge">{requests.length}</b>}</a>
          <span>👥 Groupes</span>
          <span>📅 Événements</span>
          {user&&<section className="socialFriendsPanel" id="friends">
            {requests.length>0&&<><h3>Demandes</h3>{requests.map(request=>{
              const person=people.find(item=>item.id===request.sender_id)
              return <div className="socialPerson" key={request.id}>
                <Link href={'/social/profile/'+request.sender_id}>{person?.display_name||'WakhReek'}</Link>
                <span><button onClick={()=>respondFriendRequest(request.id,true)}>✓</button><button onClick={()=>respondFriendRequest(request.id,false)}>×</button></span>
              </div>
            })}</>}
            <h3>Amis</h3>
            {friends.length?friends.slice(0,8).map(friend=><Link className="socialFriendLink" href={'/social/profile/'+friend.id} key={friend.id}>{friend.avatar_url?<img src={friend.avatar_url} alt=""/>:<i>WR</i>}<span>{friend.display_name||'WakhReek'}</span></Link>):<small>Aucun ami pour le moment</small>}
            <h3>Personnes</h3>
            {people.filter(person=>!friends.some(friend=>friend.id===person.id)).slice(0,6).map(person=><div className="socialPerson" key={person.id}>
              <Link href={'/social/profile/'+person.id}>{person.display_name||'WakhReek'}</Link>
              <button disabled={sentRequests.some(request=>request.receiver_id===person.id)} onClick={()=>sendFriendRequest(person.id)}>{sentRequests.some(request=>request.receiver_id===person.id)?'✓':'＋'}</button>
            </div>)}
          </section>}
        </aside>

        <section className="socialCleanCenter">
          {user&&<section className="socialCleanComposer">
            <textarea
              value={draft}
              maxLength={3000}
              onChange={event=>setDraft(event.target.value)}
              placeholder="Quoi de neuf ?"
            />
            {media.length>0&&<div className="socialMediaSelection">
              {media.map((file,index)=><div key={file.name+index}>
                <span>{file.type.startsWith('video/')?'🎬':'🖼️'} {file.name}</span>
                <button type="button" disabled={publishing} onClick={()=>setMedia(current=>current.filter((_,i)=>i!==index))}>×</button>
              </div>)}
            </div>}
            {publishing&&media.length>0&&<div className="socialUploadTrack"><span style={{width:uploadProgress+'%'}}/></div>}
            <div>
              <label className="socialMediaButton">＋ Photo / Vidéo
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={publishing}
                  onChange={event=>{
                    const chosen=Array.from(event.target.files||[])
                    setMedia(current=>[...current,...chosen].slice(0,10))
                    event.target.value=''
                  }}/>
              </label>
              <small>{draft.length}/3000 · {media.length}/10</small>
              <button type="button" disabled={(!draft.trim()&&!media.length)||publishing} onClick={publish}>
                {publishing?'Publication…':'Publier'}
              </button>
            </div>
          </section>}

          {error&&<div className="socialFeedError"><b>Feed :</b> {error}</div>}

          {loading?<div className="socialFeedState">Chargement des publications…</div>:
            posts.length===0?<div className="socialFeedState">
              <b>Aucune publication visible.</b>
              <button type="button" onClick={loadPosts}>Réessayer</button>
            </div>:
            <section className="socialCleanFeed">
              {posts.map(post=>{
                const profile=post.profile
                const items=mediaFor(post).slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
                return <article className="socialCleanPost" id={'post-'+post.id} key={post.id}>
                  <header>
                    {profile?.avatar_url?<img src={profile.avatar_url} alt=""/>:<span>WR</span>}
                    <div>
                      <Link href={'/social/profile/'+post.author_id}>{profile?.display_name||'WakhReek'}</Link>
                      <small>{new Date(post.created_at).toLocaleString()}</small>
                    </div>
                  </header>
                  {post.body&&<p>{post.body}</p>}
                  {items.length>0&&<div className="socialCleanMedia">
                    {items.map((item,index)=>item.media_type==='video'
                      ?<video key={index} src={item.media_url} controls playsInline preload="metadata"/>
                      :<img key={index} src={item.media_url} alt=""/>)}
                  </div>}
                  <div className="socialPostActions">
                    <button type="button" className={liked(post.id)?'liked':''} onClick={()=>toggleLike(post.id)}>♥ J’aime <span>{likes.filter(item=>item.post_id===post.id).length||''}</span></button>
                    <button type="button" onClick={()=>{setOpenComments(openComments===post.id?null:post.id);setCommentDraft('')}}>💬 Commenter <span>{comments.filter(item=>item.post_id===post.id).length||''}</span></button>
                    <button type="button" onClick={()=>sharePost(post)}>↗ Partager</button>
                  </div>
                  {openComments===post.id&&<div className="socialComments">
                    {comments.filter(item=>item.post_id===post.id).map(comment=><div className="socialComment" key={comment.id}>
                      <b>{comment.author_id===user?.id?'Vous':'WakhReek'}</b>
                      <p>{comment.body}</p>
                    </div>)}
                    {user&&<div className="socialCommentBox">
                      <input value={commentDraft} maxLength={1000} onChange={event=>setCommentDraft(event.target.value)} placeholder="Écrire un commentaire…"
                        onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();addComment(post.id)}}}/>
                      <button type="button" disabled={!commentDraft.trim()} onClick={()=>addComment(post.id)}>Envoyer</button>
                    </div>}
                  </div>}
                </article>
              })}
            </section>}
        </section>

        <aside className="socialCleanRight">
          <b>WakhReek Social</b>
          <p>Le nouveau fil Social est en construction sur une base propre.</p>
        </aside>
      </div>

      <style jsx>{`
        .socialClean{max-width:1450px;margin:0 auto;padding:0 16px 32px}
        .socialBrandBar{display:flex;align-items:center;justify-content:space-between;gap:18px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:12px 18px;margin-bottom:8px}
        .socialBrandTitle{display:flex;align-items:center;gap:10px;font-size:24px;color:#087af0}.socialBrandTitle img{width:46px;height:46px;object-fit:contain}
        .socialBrandSearch{min-width:280px;background:#f0f2f5;border-radius:24px;padding:11px 16px;color:#667085}
        .socialSectionNav{display:flex;justify-content:center;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:7px;margin-bottom:14px}
        .socialSectionNav a,.socialSectionNav span{padding:9px 15px;border-radius:10px;text-decoration:none;font-weight:800;color:#526174}.socialSectionNav a{background:#eef6ff;color:#087af0}
        .socialCleanLayout{display:grid;grid-template-columns:200px minmax(0,720px) 220px;justify-content:center;gap:16px;align-items:start}
        .socialCleanLeft,.socialCleanRight{position:sticky;top:96px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:12px}
        .socialCleanLeft{display:grid;gap:5px}.socialCleanLeft>a,.socialCleanLeft>span{padding:11px;border-radius:10px;text-decoration:none;font-weight:700;color:#526174}.socialCleanLeft .active{background:#eef6ff;color:#087af0}.requestBadge{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#d92d20;color:#fff;font-size:11px}.socialFriendsPanel{border-top:1px solid #e7edf4;margin-top:7px;padding-top:8px;min-width:0}.socialFriendsPanel h3{font-size:13px;margin:10px 4px 6px;color:#667085}.socialFriendsPanel>small{display:block;padding:4px;color:#667085}.socialFriendLink,.socialPerson{display:flex;align-items:center;gap:7px;padding:6px 4px!important;text-decoration:none!important}.socialFriendLink img,.socialFriendLink i{width:30px;height:30px;border-radius:50%;object-fit:cover}.socialFriendLink i{display:grid;place-items:center;background:#087af0;color:#fff;font-size:9px;font-style:normal}.socialFriendLink span{min-width:0;padding:0!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.socialPerson>a{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none;font-size:12px}.socialPerson>span{display:flex;padding:0!important}.socialPerson button{border:0;border-radius:8px;background:#087af0;color:#fff;font-weight:900;padding:5px 8px}.socialPerson button:disabled{opacity:.45}
        .socialCleanRight p{color:#667085;font-size:13px;line-height:1.5}
        .socialCleanCenter{min-width:0}.socialCleanComposer,.socialCleanPost,.socialFeedState,.socialFeedError{background:#fff;border:1px solid #dce5ef;border-radius:16px}
        .socialCleanComposer{padding:14px;margin-bottom:14px}.socialCleanComposer textarea{display:block;width:100%;min-height:105px;resize:vertical;border:0;outline:0;font:inherit;font-size:16px}
        .socialCleanComposer>div:last-child{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #edf1f5;padding-top:10px}.socialCleanComposer small{color:#667085}.socialMediaButton{display:inline-flex;align-items:center;border-radius:10px;background:#eef6ff;color:#087af0;font-weight:900;padding:9px 12px;cursor:pointer}.socialMediaButton input{display:none}.socialMediaSelection{display:grid!important;gap:6px!important;border-top:1px solid #edf1f5!important;padding:10px 0!important}.socialMediaSelection>div{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f7f9fc;border-radius:9px;padding:7px 10px}.socialMediaSelection span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.socialMediaSelection button{padding:2px 8px!important;background:#fff!important;color:#b42318!important;border:1px solid #fecdca!important}.socialUploadTrack{height:6px!important;padding:0!important;border:0!important;background:#e6edf5;border-radius:999px;overflow:hidden;margin:7px 0}.socialUploadTrack span{display:block;height:100%;background:#087af0;transition:width .2s}.socialCleanComposer button,.socialFeedState button{border:0;border-radius:10px;background:#087af0;color:#fff;font-weight:900;padding:10px 18px}.socialCleanComposer button:disabled{opacity:.45}
        .socialCleanFeed{display:grid;gap:14px}.socialCleanPost{overflow:hidden}.socialCleanPost header{display:flex;align-items:center;gap:10px;padding:14px}.socialCleanPost header img,.socialCleanPost header>span{width:44px;height:44px;border-radius:50%}
        .socialCleanPost header img{object-fit:cover}.socialCleanPost header>span{display:grid;place-items:center;background:#087af0;color:#fff;font-weight:900}.socialCleanPost header div{display:grid}.socialCleanPost header a{font-weight:900;text-decoration:none}.socialCleanPost header small{color:#667085;margin-top:3px}
        .socialCleanPost>p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;padding:0 14px 14px;line-height:1.55}.socialPostActions{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #edf1f5}.socialPostActions button{border:0;border-right:1px solid #edf1f5;background:#fff;padding:12px 6px;font-weight:800;color:#526174}.socialPostActions button:last-child{border-right:0}.socialPostActions button.liked{color:#d92d20}.socialPostActions span{font-weight:900}.socialComments{padding:12px 14px;border-top:1px solid #edf1f5}.socialComment{background:#f4f7fa;border-radius:12px;padding:9px 11px;margin-bottom:8px}.socialComment b{font-size:13px}.socialComment p{margin:3px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.socialCommentBox{display:flex;gap:8px}.socialCommentBox input{flex:1;min-width:0;border:1px solid #dce5ef;border-radius:999px;padding:10px 13px}.socialCommentBox button{border:0;border-radius:999px;background:#087af0;color:#fff;font-weight:900;padding:9px 14px}.socialCommentBox button:disabled{opacity:.45}.socialCleanMedia{display:grid;gap:2px;background:#eef2f6}.socialCleanMedia img,.socialCleanMedia video{display:block;width:100%;max-height:650px;object-fit:contain;background:#050505}
        .socialFeedState,.socialFeedError{padding:24px;text-align:center}.socialFeedState{color:#667085}.socialFeedState button{display:block;margin:12px auto 0}.socialFeedError{margin-bottom:14px;color:#b42318;background:#fff6f5;border-color:#fecdca}
        @media(max-width:980px){.socialCleanLayout{grid-template-columns:180px minmax(0,1fr)}.socialCleanRight{display:none}}
        @media(max-width:720px){.socialClean{padding:0 8px 24px}.socialBrandSearch{display:none}.socialSectionNav{overflow-x:auto;justify-content:flex-start}.socialCleanLayout{display:block}.socialCleanLeft{position:static;display:flex;overflow-x:auto;margin-bottom:12px}.socialCleanLeft a,.socialCleanLeft span{white-space:nowrap}.socialCleanPost header{padding:12px}}
      `}</style>
    </main>
  </AppShell>
}
