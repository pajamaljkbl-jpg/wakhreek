'use client'

import {useEffect} from 'react'
import {useRouter} from 'next/navigation'

export default function TvRedirect(){
 const router=useRouter()
 useEffect(()=>{router.replace('/social')},[router])
 return <main style={{minHeight:'60vh',display:'grid',placeItems:'center',fontFamily:'system-ui',color:'#667085'}}>WakhReek Social…</main>
}
