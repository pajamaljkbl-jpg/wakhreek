import {NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'

export const runtime='nodejs'
export const maxDuration=60

export async function POST(req){
 try{
  if(!process.env.FAL_KEY)return NextResponse.json({error:'FAL_KEY is not configured'},{status:500})
  const auth=req.headers.get('authorization')||''
  if(!auth.startsWith('Bearer '))return NextResponse.json({error:'Unauthorized'},{status:401})
  const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{global:{headers:{Authorization:auth}}})
  const{data:{user},error:userError}=await supabase.auth.getUser()
  if(userError||!user||user.app_metadata?.role!=='admin')return NextResponse.json({error:'Admin only'},{status:403})
  const body=await req.json()
  const prompt=String(body?.prompt||'').trim()
  if(prompt.length<3)return NextResponse.json({error:'Prompt required'},{status:400})
  if(prompt.length>4000)return NextResponse.json({error:'Prompt too long'},{status:400})
  const allowedSizes=new Set(['square_hd','square','portrait_4_3','portrait_16_9','landscape_4_3','landscape_16_9'])
  const image_size=allowedSizes.has(body?.image_size)?body.image_size:'square_hd'
  const r=await fetch('https://fal.run/fal-ai/flux-2/turbo',{method:'POST',headers:{Authorization:`Key ${process.env.FAL_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({prompt,image_size,num_images:1,enable_safety_checker:true,output_format:'jpeg'})})
  const data=await r.json().catch(()=>({}))
  if(!r.ok)return NextResponse.json({error:data?.detail||data?.error||`fal error ${r.status}`},{status:r.status})
  const image=data?.images?.[0]
  if(!image?.url)return NextResponse.json({error:'No image returned'},{status:502})
  return NextResponse.json({image,seed:data.seed,prompt:data.prompt||prompt,model:'fal-ai/flux-2/turbo'})
 }catch(e){return NextResponse.json({error:e?.message||'Generation failed'},{status:500})}
}
