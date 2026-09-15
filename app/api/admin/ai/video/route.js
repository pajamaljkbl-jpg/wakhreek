import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

export const runtime='nodejs'
export const maxDuration=60

const MODEL='fal-ai/kling-video/v3/turbo/standard/text-to-video'
const FAL_BASE='https://queue.fal.run'

async function verifyAdmin(req){
 const auth=req.headers.get('authorization')||''
 if(!auth.startsWith('Bearer '))return {error:NextResponse.json({error:'Unauthorized'},{status:401})}
 const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
 const supabaseKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 if(!supabaseUrl||!supabaseKey)return {error:NextResponse.json({error:'Supabase server configuration is missing'},{status:500})}
 const supabase=createClient(supabaseUrl,supabaseKey,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}})
 const{data:{user},error}=await supabase.auth.getUser(auth.slice(7))
 if(error||!user||user.app_metadata?.role!=='admin')return {error:NextResponse.json({error:'Admin only'},{status:403})}
 return {user}
}

export async function POST(req){
 try{
  if(!process.env.FAL_KEY)return NextResponse.json({error:'FAL_KEY is not configured'},{status:500})
  const verified=await verifyAdmin(req);if(verified.error)return verified.error
  const body=await req.json()
  const prompt=String(body?.prompt||'').trim()
  if(prompt.length<3)return NextResponse.json({error:'Prompt required'},{status:400})
  if(prompt.length>4000)return NextResponse.json({error:'Prompt too long'},{status:400})
  const duration=['5','10'].includes(String(body?.duration))?String(body.duration):'5'
  const aspect_ratio=['16:9','9:16','1:1'].includes(body?.aspect_ratio)?body.aspect_ratio:'16:9'
  const generate_audio=body?.generate_audio===true
  const r=await fetch(`${FAL_BASE}/${MODEL}`,{method:'POST',headers:{Authorization:`Key ${process.env.FAL_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({prompt,duration,aspect_ratio,generate_audio})})
  const data=await r.json().catch(()=>({}))
  if(!r.ok)return NextResponse.json({error:data?.detail||data?.error||`fal error ${r.status}`},{status:r.status})
  const requestId=data?.request_id
  if(!requestId)return NextResponse.json({error:'No video request id returned'},{status:502})
  return NextResponse.json({request_id:requestId,status:'IN_QUEUE',model:MODEL})
 }catch(e){return NextResponse.json({error:e?.message||'Video submission failed'},{status:500})}
}

export async function GET(req){
 try{
  if(!process.env.FAL_KEY)return NextResponse.json({error:'FAL_KEY is not configured'},{status:500})
  const verified=await verifyAdmin(req);if(verified.error)return verified.error
  const requestId=new URL(req.url).searchParams.get('request_id')||''
  if(!/^[A-Za-z0-9_-]{8,200}$/.test(requestId))return NextResponse.json({error:'Invalid request id'},{status:400})
  const headers={Authorization:`Key ${process.env.FAL_KEY}`}
  const sr=await fetch(`${FAL_BASE}/${MODEL}/requests/${requestId}/status`,{headers,cache:'no-store'})
  const status=await sr.json().catch(()=>({}))
  if(!sr.ok)return NextResponse.json({error:status?.detail||status?.error||`fal status error ${sr.status}`},{status:sr.status})
  if(status?.status!=='COMPLETED')return NextResponse.json({request_id:requestId,status:status?.status||'IN_PROGRESS',queue_position:status?.queue_position??null})
  const rr=await fetch(`${FAL_BASE}/${MODEL}/requests/${requestId}`,{headers,cache:'no-store'})
  const result=await rr.json().catch(()=>({}))
  if(!rr.ok)return NextResponse.json({error:result?.detail||result?.error||`fal result error ${rr.status}`},{status:rr.status})
  const video=result?.video||result?.data?.video
  if(!video?.url)return NextResponse.json({error:'No video returned'},{status:502})
  return NextResponse.json({request_id:requestId,status:'COMPLETED',video,model:MODEL})
 }catch(e){return NextResponse.json({error:e?.message||'Video status failed'},{status:500})}
}
