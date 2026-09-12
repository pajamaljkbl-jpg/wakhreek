export const boutiquePublicMessages={
  fr:{shopUnavailable:'Boutique indisponible',shopOwner:'PROPRIÉTAIRE DE LA BOUTIQUE',welcomeShop:'Bienvenue dans cette boutique WakhReek.',validated:'Validée',advertising:'Publicité',shopContactWindow:'Fenêtre contact boutique',noProductsYet:'Aucun produit pour le moment.',stock:'Stock',outOfStock:'Rupture de stock'},
  ar:{shopUnavailable:'المتجر غير متاح',shopOwner:'مالك المتجر',welcomeShop:'مرحباً بكم في هذا المتجر على WakhReek.',validated:'موثّق',advertising:'إعلان',shopContactWindow:'نافذة تواصل المتجر',noProductsYet:'لا توجد منتجات حالياً.',stock:'المخزون',outOfStock:'نفد المخزون'},
  en:{shopUnavailable:'Shop unavailable',shopOwner:'SHOP OWNER',welcomeShop:'Welcome to this WakhReek shop.',validated:'Validated',advertising:'Advertising',shopContactWindow:'Shop contact window',noProductsYet:'No products yet.',stock:'Stock',outOfStock:'Out of stock'},
  es:{shopUnavailable:'Tienda no disponible',shopOwner:'PROPIETARIO DE LA TIENDA',welcomeShop:'Bienvenido a esta tienda WakhReek.',validated:'Validada',advertising:'Publicidad',shopContactWindow:'Ventana de contacto de la tienda',noProductsYet:'No hay productos por el momento.',stock:'Stock',outOfStock:'Agotado'},
  pt:{shopUnavailable:'Loja indisponível',shopOwner:'PROPRIETÁRIO DA LOJA',welcomeShop:'Bem-vindo a esta loja WakhReek.',validated:'Validada',advertising:'Publicidade',shopContactWindow:'Janela de contato da loja',noProductsYet:'Nenhum produto no momento.',stock:'Estoque',outOfStock:'Sem estoque'},
  de:{shopUnavailable:'Shop nicht verfügbar',shopOwner:'SHOP-INHABER',welcomeShop:'Willkommen in diesem WakhReek-Shop.',validated:'Geprüft',advertising:'Werbung',shopContactWindow:'Shop-Kontaktfenster',noProductsYet:'Noch keine Produkte.',stock:'Bestand',outOfStock:'Nicht auf Lager'},
  nl:{shopUnavailable:'Winkel niet beschikbaar',shopOwner:'WINKEL-EIGENAAR',welcomeShop:'Welkom in deze WakhReek-winkel.',validated:'Gevalideerd',advertising:'Advertentie',shopContactWindow:'Contactvenster winkel',noProductsYet:'Nog geen producten.',stock:'Voorraad',outOfStock:'Niet op voorraad'}
}

export function boutiquePublicTranslate(language,key,fallback){
  return boutiquePublicMessages[language]?.[key]??boutiquePublicMessages.fr?.[key]??fallback??key
}
