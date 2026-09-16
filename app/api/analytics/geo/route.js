import {NextResponse} from 'next/server'

export const dynamic='force-dynamic'

export async function GET(request){
  const h=request.headers
  const country=(h.get('x-vercel-ip-country')||h.get('cf-ipcountry')||'').trim().toUpperCase()
  return NextResponse.json({country:/^[A-Z]{2}$/.test(country)?country:null},{headers:{'Cache-Control':'no-store'}})
}
