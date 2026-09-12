export const LANGUAGES=[
 {code:'fr',flag:'🇫🇷',name:'Français',dir:'ltr'},
 {code:'ar',flag:'🇲🇦',name:'العربية',dir:'rtl'},
 {code:'en',flag:'🇬🇧',name:'English',dir:'ltr'},
 {code:'es',flag:'🇪🇸',name:'Español',dir:'ltr'},
 {code:'pt',flag:'🇵🇹',name:'Português',dir:'ltr'},
 {code:'de',flag:'🇩🇪',name:'Deutsch',dir:'ltr'},
 {code:'nl',flag:'🇳🇱',name:'Nederlands',dir:'ltr'}
]

export const DEFAULT_LANGUAGE='fr'
export const LANGUAGE_CODES=new Set(LANGUAGES.map(x=>x.code))

export const messages={
 fr:{language:'Langue',loading:'Chargement...',refresh:'Actualiser',back:'Retour',approve:'Approuver',reject:'Refuser',pending:'En attente',approved:'Approuvé',rejected:'Refusé',active:'Active',inactive:'Inactive',shop:'Boutique',shops:'Boutiques',payment:'Paiement',payments:'Paiements',amount:'Montant',country:'Pays',method:'Moyen',reference:'Référence',submittedAt:'Soumis le',admin:'Admin',communication:'Communication',market:'Marché'},
 ar:{language:'اللغة',loading:'جارٍ التحميل...',refresh:'تحديث',back:'رجوع',approve:'موافقة',reject:'رفض',pending:'قيد الانتظار',approved:'مقبول',rejected:'مرفوض',active:'نشطة',inactive:'غير نشطة',shop:'متجر',shops:'المتاجر',payment:'الدفع',payments:'المدفوعات',amount:'المبلغ',country:'البلد',method:'الوسيلة',reference:'المرجع',submittedAt:'تاريخ الإرسال',admin:'الإدارة',communication:'التواصل',market:'السوق'},
 en:{language:'Language',loading:'Loading...',refresh:'Refresh',back:'Back',approve:'Approve',reject:'Reject',pending:'Pending',approved:'Approved',rejected:'Rejected',active:'Active',inactive:'Inactive',shop:'Shop',shops:'Shops',payment:'Payment',payments:'Payments',amount:'Amount',country:'Country',method:'Method',reference:'Reference',submittedAt:'Submitted at',admin:'Admin',communication:'Communication',market:'Market'},
 es:{language:'Idioma',loading:'Cargando...',refresh:'Actualizar',back:'Volver',approve:'Aprobar',reject:'Rechazar',pending:'Pendiente',approved:'Aprobado',rejected:'Rechazado',active:'Activa',inactive:'Inactiva',shop:'Tienda',shops:'Tiendas',payment:'Pago',payments:'Pagos',amount:'Importe',country:'País',method:'Método',reference:'Referencia',submittedAt:'Enviado el',admin:'Admin',communication:'Comunicación',market:'Mercado'},
 pt:{language:'Idioma',loading:'Carregando...',refresh:'Atualizar',back:'Voltar',approve:'Aprovar',reject:'Recusar',pending:'Pendente',approved:'Aprovado',rejected:'Recusado',active:'Ativa',inactive:'Inativa',shop:'Loja',shops:'Lojas',payment:'Pagamento',payments:'Pagamentos',amount:'Valor',country:'País',method:'Método',reference:'Referência',submittedAt:'Enviado em',admin:'Admin',communication:'Comunicação',market:'Mercado'},
 de:{language:'Sprache',loading:'Laden...',refresh:'Aktualisieren',back:'Zurück',approve:'Genehmigen',reject:'Ablehnen',pending:'Ausstehend',approved:'Genehmigt',rejected:'Abgelehnt',active:'Aktiv',inactive:'Inaktiv',shop:'Shop',shops:'Shops',payment:'Zahlung',payments:'Zahlungen',amount:'Betrag',country:'Land',method:'Methode',reference:'Referenz',submittedAt:'Eingereicht am',admin:'Admin',communication:'Kommunikation',market:'Markt'},
 nl:{language:'Taal',loading:'Laden...',refresh:'Vernieuwen',back:'Terug',approve:'Goedkeuren',reject:'Weigeren',pending:'In afwachting',approved:'Goedgekeurd',rejected:'Geweigerd',active:'Actief',inactive:'Inactief',shop:'Winkel',shops:'Winkels',payment:'Betaling',payments:'Betalingen',amount:'Bedrag',country:'Land',method:'Methode',reference:'Referentie',submittedAt:'Ingediend op',admin:'Admin',communication:'Communicatie',market:'Markt'}
}

export function normalizeLanguage(lang){return LANGUAGE_CODES.has(lang)?lang:DEFAULT_LANGUAGE}
export function translate(lang,key,fallback){const l=normalizeLanguage(lang);return messages[l]?.[key]??messages[DEFAULT_LANGUAGE]?.[key]??fallback??key}
