'use client'

import {useEffect} from 'react'

// Proofreading layer for UI/system text only. It never edits input values,
// chat textareas, product data, shop names, or other user-entered content.
const FIXES={
 fr:[
  ['Inscris-toi pour accéder aux boutiques et à la messagerie.','Inscrivez-vous pour accéder aux boutiques et à la messagerie.'],
  ['En continuant, tu acceptes nos','En continuant, vous acceptez nos'],
  ['Tu as déjà un compte ?','Vous avez déjà un compte ?'],
  ['Tu n’as pas encore de compte ?','Vous n’avez pas encore de compte ?'],
  ['Achète et vends','Achetez et vendez'],
  ['Échange en sécurité','Échangez en toute sécurité'],
  ['Reste connecté','Restez connecté'],
  ['Erreur boutique:','Erreur lors de la création de la boutique :'],
  ['Boutique créée, mais l’abonnement n’a pas pu être enregistré:','Boutique créée, mais l’abonnement n’a pas pu être enregistré :'],
  ['Demande enregistrée:','Demande enregistrée :'],
  ['Référence:','Référence :'],
  ['Stock:','Stock :'],
  ['Fenêtre contact boutique','Fenêtre de contact de la boutique'],
  ['Cette fenêtre appartient au magasin. Elle est séparée de Communication personnelle WakhReek.','Cette fenêtre appartient à la boutique. Elle est distincte de la communication personnelle WakhReek.'],
  ['Messages boutique reçus','Messages reçus par la boutique'],
  ['Photo du propriétaire / image choisie','Photo du propriétaire / image sélectionnée'],
  ['Division Publicité','Division Publicité'],
 ],
 en:[
  ['Registration requires e-mail and phone. Once signed in, your account stays open on this device.','Registration requires an email address and phone number. Once signed in, your account stays open on this device.'],
  ['Chat securely','Communicate securely'],
  ['No conversation','No conversations'],
  ['Shop communications','Shop communication'],
  ['Shop messages received','Messages received by the shop'],
  ['Owner photo / selected image','Owner photo / selected image'],
  ['Stock not declared','Stock not specified'],
  ['The shop stays inactive until payment and approval.','The shop remains inactive until payment and approval.'],
 ],
 ar:[
  ['سجّل للوصول إلى المتاجر والمراسلة.','سجّل حسابك للوصول إلى المتاجر وخدمة المراسلة.'],
  ['بالمتابعة، أنت توافق على','بالمتابعة، فإنك توافق على'],
  ['اشترِ وبِع','اشترِ وبِع بسهولة'],
  ['رسائلك الشخصية','رسائلك الشخصية محمية'],
  ['المخزون غير معلن','المخزون غير محدد'],
  ['نافذة تواصل المتجر','نافذة التواصل مع المتجر'],
  ['هذه النافذة خاصة بالمتجر ومنفصلة عن تواصل WakhReek الشخصي.','هذه النافذة خاصة بالمتجر، وهي منفصلة عن التواصل الشخصي في WakhReek.'],
  ['رسائل المتجر المستلمة','الرسائل المستلمة في المتجر'],
  ['بعد الإرسال يتم إنشاء اشتراك قيد الانتظار. يبقى المتجر غير نشط حتى الدفع والموافقة.','بعد إرسال الطلب، يتم إنشاء اشتراك قيد الانتظار. ويبقى المتجر غير نشط إلى حين إتمام الدفع والموافقة.'],
  ['صورة المالك / الصورة المختارة','صورة المالك / الصورة المحددة'],
 ],
 es:[
  ['El registro requiere correo y teléfono. Una vez conectado, tu cuenta permanece abierta en este dispositivo.','El registro requiere correo electrónico y número de teléfono. Una vez que inicies sesión, tu cuenta permanecerá abierta en este dispositivo.'],
  ['Ninguna conversación','No hay conversaciones'],
  ['Ventana de contacto de tienda','Ventana de contacto de la tienda'],
  ['Mensajes de tienda recibidos','Mensajes recibidos por la tienda'],
  ['Tras enviar, se crea una suscripción pendiente. La tienda permanece inactiva hasta el pago y la aprobación.','Tras enviar la solicitud, se crea una suscripción pendiente. La tienda permanece inactiva hasta que se complete el pago y sea aprobada.'],
 ],
 pt:[
  ['O cadastro exige e-mail e telefone. Depois de entrar, sua conta fica aberta neste dispositivo.','O cadastro exige e-mail e número de telefone. Depois de entrar, sua conta permanece aberta neste dispositivo.'],
  ['Nenhuma conversa','Nenhuma conversa disponível'],
  ['Janela de contato da loja','Janela de contato com a loja'],
  ['Mensagens da loja recebidas','Mensagens recebidas pela loja'],
  ['Após o envio, uma assinatura pendente é criada. A loja fica inativa até pagamento e aprovação.','Após o envio da solicitação, uma assinatura pendente é criada. A loja permanece inativa até a conclusão do pagamento e a aprovação.'],
 ],
 de:[
  ['Suchen oder Unterhaltung starten','Suchen oder eine Unterhaltung starten'],
  ['Informationen konnten nicht geprüft werden. Erneut versuchen.','Die Informationen konnten nicht überprüft werden. Bitte versuchen Sie es erneut.'],
  ['Shop-Kommunikation','Shop-Kommunikation'],
  ['Empfangene Shop-Nachrichten','Vom Shop empfangene Nachrichten'],
  ['Der Shop bleibt bis Zahlung und Freigabe inaktiv.','Der Shop bleibt bis zur Zahlung und Freigabe inaktiv.'],
  ['Shop-Kontaktfenster','Kontaktfenster des Shops'],
 ],
 nl:[
  ['Gebruiker contacteren','Contact opnemen met een gebruiker'],
  ['Na inloggen blijft je account op dit apparaat geopend.','Na het inloggen blijft je account op dit apparaat geopend.'],
  ['Geen gesprek','Geen gesprekken'],
  ['Winkelcommunicatie','Winkelcommunicatie'],
  ['Ontvangen winkelberichten','Berichten ontvangen door de winkel'],
  ['Na indienen wordt een wachtend abonnement gemaakt. De winkel blijft inactief tot betaling en goedkeuring.','Na het indienen wordt een abonnement in afwachting aangemaakt. De winkel blijft inactief tot de betaling en goedkeuring zijn voltooid.'],
  ['Winkelcontactvenster','Contactvenster van de winkel'],
 ]
}

const touched=new Map()
let applying=false

function replaceText(text,lang){
 let out=text
 for(const [from,to] of FIXES[lang]||[]) if(out.includes(from)) out=out.split(from).join(to)
 return out
}

function proofread(lang){
 if(applying)return
 applying=true
 try{
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT)
  let node
  while((node=walker.nextNode())){
   const p=node.parentElement
   if(!p||p.closest('.wr-language,[data-user-content]')||['SCRIPT','STYLE','TEXTAREA','INPUT','CODE','PRE'].includes(p.tagName))continue
   const before=node.nodeValue||''
   const after=replaceText(before,lang)
   if(after!==before){
    if(!touched.has(node))touched.set(node,before)
    node.nodeValue=after
   }
  }
  document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el=>{
   if(el.closest('.wr-language,[data-user-content]'))return
   for(const attr of ['placeholder','title','aria-label']){
    if(!el.hasAttribute(attr))continue
    const before=el.getAttribute(attr)||'',after=replaceText(before,lang)
    if(after!==before)el.setAttribute(attr,after)
   }
  })
 }finally{applying=false}
}

function restoreTouched(){
 applying=true
 try{for(const [node,source] of touched){if(node?.isConnected)node.nodeValue=source}touched.clear()}
 finally{applying=false}
}

export default function LanguageProofreader(){
 useEffect(()=>{
  let lang='fr',timer=null
  try{lang=localStorage.getItem('wakhreek_language')||'fr'}catch{}
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>proofread(lang),60)}
  const onLanguage=e=>{restoreTouched();lang=e.detail?.language||'fr';schedule()}
  const observer=new MutationObserver(()=>{if(!applying)schedule()})
  observer.observe(document.body,{subtree:true,childList:true,characterData:true})
  window.addEventListener('wakhreek-language-change',onLanguage)
  schedule()
  return()=>{clearTimeout(timer);observer.disconnect();window.removeEventListener('wakhreek-language-change',onLanguage);restoreTouched()}
 },[])
 return null
}
