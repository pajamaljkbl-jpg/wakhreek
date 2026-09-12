'use client'

import {useI18n} from './I18nProvider'
export {LANGUAGES as WAKHREEK_LANGUAGES} from '../lib/i18n'

export default function LanguageSwitcher(){
 const{language,setLanguage,languages,ready,t}=useI18n()
 return <div className="wr-language" title={t('language','Language / Langue')} data-no-translate>
  <select value={language} onChange={e=>setLanguage(e.target.value)} aria-label={t('language','Language')} disabled={!ready}>
   {languages.map(({code,flag,name})=><option value={code} key={code}>{flag} {name}</option>)}
  </select>
  <style jsx>{`.wr-language{position:fixed;right:14px;top:12px;z-index:10050}.wr-language select{max-width:155px;border:1px solid #d7e0eb;border-radius:10px;background:#fff;color:#172033;padding:8px 9px;font-weight:700;box-shadow:0 3px 14px #00000018;cursor:pointer}[dir="rtl"] .wr-language{right:auto;left:14px}@media(max-width:700px){.wr-language{right:8px;top:8px}[dir="rtl"] .wr-language{right:auto;left:8px}.wr-language select{max-width:118px;padding:7px 5px;font-size:12px}}`}</style>
 </div>
}
