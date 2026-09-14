const COUNTRY_NAMES={
 en:{DZA:'Algeria',BEN:'Benin',BFA:'Burkina Faso',CPV:'Cabo Verde',CIV:"Côte d’Ivoire",EGY:'Egypt',GMB:'The Gambia',GHA:'Ghana',GIN:'Guinea',GNB:'Guinea-Bissau',LBR:'Liberia',LBY:'Libya',MLI:'Mali',MAR:'Morocco',MRT:'Mauritania',NER:'Niger',NGA:'Nigeria',SEN:'Senegal',SLE:'Sierra Leone',TGO:'Togo',TUN:'Tunisia'},
 pt:{DZA:'Argélia',BEN:'Benim',BFA:'Burkina Faso',CPV:'Cabo Verde',CIV:'Costa do Marfim',EGY:'Egito',GMB:'Gâmbia',GHA:'Gana',GIN:'Guiné',GNB:'Guiné-Bissau',LBR:'Libéria',LBY:'Líbia',MLI:'Mali',MAR:'Marrocos',MRT:'Mauritânia',NER:'Níger',NGA:'Nigéria',SEN:'Senegal',SLE:'Serra Leoa',TGO:'Togo',TUN:'Tunísia'}
}

const CATEGORY_NAMES={
 traditional_medicine:{ar:'الطب التقليدي',en:'Traditional medicine',pt:'Medicina tradicional'},
 crafts:{ar:'الحرف والصناعة التقليدية',en:'Crafts',pt:'Artesanato'},
 beauty_wellness:{ar:'الجمال والعناية',en:'Beauty & wellness',pt:'Beleza & bem-estar'},
 jewelry_accessories:{ar:'المجوهرات والإكسسوارات',en:'Jewelry & accessories',pt:'Joias & acessórios'},
 home_decoration:{ar:'المنزل والديكور',en:'Home & decoration',pt:'Casa & decoração'},
 fashion_clothing:{ar:'الأزياء والملابس',en:'Fashion & clothing',pt:'Moda & vestuário'},
 electronics:{ar:'الإلكترونيات',en:'Electronics',pt:'Eletrónica'},
 food:{ar:'المواد الغذائية',en:'Food',pt:'Alimentação'},
 books_education:{ar:'الكتب والتعليم',en:'Books & education',pt:'Livros & educação'},
 services:{ar:'الخدمات',en:'Services',pt:'Serviços'},
 automotive:{ar:'السيارات والدراجات',en:'Auto & motorcycle',pt:'Auto & moto'},
 sports_leisure:{ar:'الرياضة والترفيه',en:'Sports & leisure',pt:'Desporto & lazer'},
 agriculture:{ar:'الفلاحة وتربية المواشي',en:'Agriculture & livestock',pt:'Agricultura & pecuária'},
 professional_equipment:{ar:'التجهيزات المهنية',en:'Professional equipment',pt:'Equipamento profissional'},
 other:{ar:'أخرى',en:'Other',pt:'Outros'}
}

const REGION_TO_MARKET={
 'fr-SN':'SEN','fr-GN':'GIN','en-NG':'NGA','en-GM':'GMB','ar-MA':'MAR','fr-MA':'MAR','pt-GW':'GNB','pt-CV':'CPV','en-GH':'GHA','fr-CI':'CIV','fr-BJ':'BEN','fr-TG':'TGO','en-SL':'SLE','en-LR':'LBR'
}

export function marketCountryName(country,language){
 if(!country)return ''
 if(language==='ar'&&country.name_ar)return country.name_ar
 if(COUNTRY_NAMES[language]?.[country.code])return COUNTRY_NAMES[language][country.code]
 return country.name_fr||country.code||''
}

export function marketCategoryName(category,language){
 if(!category)return ''
 return CATEGORY_NAMES[category.code]?.[language]||category.name_fr||category.code||''
}

export function detectInitialMarketCode(availableCodes=[]){
 const available=new Set(availableCodes)
 if(typeof navigator!=='undefined'){
  const locales=[...(navigator.languages||[]),navigator.language].filter(Boolean)
  for(const locale of locales){
   const normalized=String(locale).replace('_','-')
   const exact=Object.entries(REGION_TO_MARKET).find(([key])=>key.toLowerCase()===normalized.toLowerCase())?.[1]
   if(exact&&available.has(exact))return exact
  }
 }
 return available.has('SEN')?'SEN':availableCodes[0]||''
}
