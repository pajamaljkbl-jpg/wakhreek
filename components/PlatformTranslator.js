'use client'

import {useEffect} from 'react'

// Source language is French. Each row: fr, en, ar, es, pt, de, nl.
const R=[
['FR⌄','EN⌄','AR⌄','ES⌄','PT⌄','DE⌄','NL⌄'],
['◎  FR','◎  EN','◎  AR','◎  ES','◎  PT','◎  DE','◎  NL'],
['Chargement TV…','Loading TV…','جارٍ تحميل التلفاز…','Cargando TV…','Carregando TV…','TV wird geladen…','TV laden…'],
['Chargement...','Loading...','جارٍ التحميل...','Cargando...','Carregando...','Laden...','Laden...'],
['Chargement…','Loading…','جارٍ التحميل…','Cargando…','Carregando…','Laden…','Laden…'],
['Déconnexion','Sign out','تسجيل الخروج','Cerrar sesión','Sair','Abmelden','Uitloggen'],
['Aide','Help','مساعدة','Ayuda','Ajuda','Hilfe','Hulp'],
['Inscription ou connexion','Sign up or sign in','التسجيل أو تسجيل الدخول','Registro o inicio de sesión','Cadastro ou login','Registrierung oder Anmeldung','Registreren of inloggen'],
['Inscription','Sign up','التسجيل','Registro','Cadastro','Registrierung','Registreren'],
['Connexion','Sign in','تسجيل الدخول','Iniciar sesión','Entrar','Anmelden','Inloggen'],
['Nom complet','Full name','الاسم الكامل','Nombre completo','Nome completo','Vollständiger Name','Volledige naam'],
['Téléphone','Phone','الهاتف','Teléfono','Telefone','Telefon','Telefoon'],
['Mot de passe','Password','كلمة المرور','Contraseña','Senha','Passwort','Wachtwoord'],
['Afficher ou masquer le mot de passe','Show or hide password','إظهار أو إخفاء كلمة المرور','Mostrar u ocultar la contraseña','Mostrar ou ocultar a senha','Passwort anzeigen oder ausblenden','Wachtwoord tonen of verbergen'],
['S’inscrire / Créer mon compte','Sign up / Create my account','التسجيل / إنشاء حسابي','Registrarme / Crear mi cuenta','Cadastrar / Criar minha conta','Registrieren / Mein Konto erstellen','Registreren / Mijn account maken'],
["S'inscrire / Se connecter",'Sign up / Sign in','التسجيل / تسجيل الدخول','Registrarse / Iniciar sesión','Cadastrar / Entrar','Registrieren / Anmelden','Registreren / Inloggen'],
['Se connecter','Sign in','تسجيل الدخول','Iniciar sesión','Entrar','Anmelden','Inloggen'],
['Créer mon compte','Create my account','إنشاء حسابي','Crear mi cuenta','Criar minha conta','Mein Konto erstellen','Mijn account maken'],
['Créer un compte','Create account','إنشاء حساب','Crear cuenta','Criar conta','Konto erstellen','Account maken'],
['Créer un compte sécurisé ou se connecter','Create a secure account or sign in','إنشاء حساب آمن أو تسجيل الدخول','Crear una cuenta segura o iniciar sesión','Criar uma conta segura ou entrar','Sicheres Konto erstellen oder anmelden','Veilig account maken of inloggen'],
['Inscris-toi pour accéder aux boutiques et à la messagerie.','Sign up to access shops and messaging.','سجّل للوصول إلى المتاجر والمراسلة.','Regístrate para acceder a las tiendas y la mensajería.','Cadastre-se para acessar as lojas e as mensagens.','Registriere dich für Shops und Nachrichten.','Registreer je voor winkels en berichten.'],
['Inscription avec e-mail et téléphone obligatoire. Une fois connecté, ton compte reste ouvert sur cet appareil.','Registration requires e-mail and phone. Once signed in, your account stays open on this device.','التسجيل يتطلب البريد الإلكتروني والهاتف. بعد تسجيل الدخول يبقى حسابك مفتوحاً على هذا الجهاز.','El registro requiere correo y teléfono. Una vez conectado, tu cuenta permanece abierta en este dispositivo.','O cadastro exige e-mail e telefone. Depois de entrar, sua conta fica aberta neste dispositivo.','Registrierung erfordert E-Mail und Telefon. Nach der Anmeldung bleibt dein Konto auf diesem Gerät geöffnet.','Registratie vereist e-mail en telefoon. Na inloggen blijft je account op dit apparaat geopend.'],
['En continuant, tu acceptes nos','By continuing, you accept our','بالمتابعة، أنت توافق على','Al continuar, aceptas nuestros','Ao continuar, você aceita nossos','Wenn du fortfährst, akzeptierst du unsere','Door verder te gaan accepteer je onze'],
['Conditions d’utilisation','Terms of use','شروط الاستخدام','Condiciones de uso','Termos de uso','Nutzungsbedingungen','Gebruiksvoorwaarden'],
['Politique de confidentialité.','Privacy policy.','سياسة الخصوصية.','Política de privacidad.','Política de privacidade.','Datenschutzrichtlinie.','Privacybeleid.'],
['Tu as déjà un compte ?','Already have an account?','لديك حساب بالفعل؟','¿Ya tienes una cuenta?','Já tem uma conta?','Hast du bereits ein Konto?','Heb je al een account?'],
['Tu n’as pas encore de compte ?','Don’t have an account yet?','ليس لديك حساب بعد؟','¿Aún no tienes una cuenta?','Ainda não tem uma conta?','Noch kein Konto?','Nog geen account?'],
["J'ai déjà un compte — Se connecter",'I already have an account — Sign in','لدي حساب بالفعل — تسجيل الدخول','Ya tengo una cuenta — Iniciar sesión','Já tenho uma conta — Entrar','Ich habe bereits ein Konto — Anmelden','Ik heb al een account — Inloggen'],
["Je n'ai pas de compte — S'inscrire",'I don’t have an account — Sign up','ليس لدي حساب — التسجيل','No tengo cuenta — Registrarme','Não tenho conta — Cadastrar','Ich habe kein Konto — Registrieren','Ik heb geen account — Registreren'],
['Achète et vends','Buy and sell','اشترِ وبِع','Compra y vende','Compre e venda','Kaufen und verkaufen','Koop en verkoop'],
['Messagerie','Messaging','المراسلة','Mensajería','Mensagens','Nachrichten','Berichten'],
['Échange en sécurité','Chat securely','تواصل بأمان','Comunícate con seguridad','Converse com segurança','Sicher kommunizieren','Veilig communiceren'],
['Communauté','Community','المجتمع','Comunidad','Comunidade','Community','Community'],
['Reste connecté','Stay connected','ابقَ على تواصل','Mantente conectado','Fique conectado','Bleib verbunden','Blijf verbonden'],
['Veuillez remplir tous les champs.','Please fill in all fields.','يرجى ملء جميع الحقول.','Completa todos los campos.','Preencha todos os campos.','Bitte alle Felder ausfüllen.','Vul alle velden in.'],
['Vérification des informations...','Checking information...','جارٍ التحقق من المعلومات...','Verificando la información...','Verificando as informações...','Informationen werden geprüft...','Gegevens controleren...'],
['Impossible de vérifier les informations. Réessayez.','Unable to verify the information. Try again.','تعذر التحقق من المعلومات. حاول مجدداً.','No se pudo verificar la información. Inténtalo de nuevo.','Não foi possível verificar as informações. Tente novamente.','Informationen konnten nicht geprüft werden. Erneut versuchen.','Gegevens konden niet worden gecontroleerd. Probeer opnieuw.'],
['Ce numéro de téléphone est déjà utilisé par un autre compte.','This phone number is already used by another account.','رقم الهاتف هذا مستخدم بالفعل في حساب آخر.','Este número de teléfono ya está usado por otra cuenta.','Este número de telefone já é usado por outra conta.','Diese Telefonnummer wird bereits von einem anderen Konto verwendet.','Dit telefoonnummer wordt al door een ander account gebruikt.'],
['Création du compte...','Creating account...','جارٍ إنشاء الحساب...','Creando la cuenta...','Criando a conta...','Konto wird erstellt...','Account maken...'],
['Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.','Account created. Check your e-mail to confirm registration.','تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد التسجيل.','Cuenta creada. Revisa tu correo para confirmar el registro.','Conta criada. Verifique seu e-mail para confirmar o cadastro.','Konto erstellt. Prüfe deine E-Mail zur Bestätigung.','Account gemaakt. Controleer je e-mail om de registratie te bevestigen.'],
['Connexion...','Signing in...','جارٍ تسجيل الدخول...','Iniciando sesión...','Entrando...','Anmeldung...','Inloggen...'],

['Communication','Communication','التواصل','Comunicación','Comunicação','Kommunikation','Communicatie'],
['En ligne','Online','متصل','En línea','Online','Online','Online'],
['Rechercher ou démarrer une discussion','Search or start a conversation','البحث أو بدء محادثة','Buscar o iniciar una conversación','Pesquisar ou iniciar uma conversa','Suchen oder Unterhaltung starten','Zoeken of gesprek starten'],
['Contacter un utilisateur','Contact a user','التواصل مع مستخدم','Contactar a un usuario','Contatar um usuário','Benutzer kontaktieren','Gebruiker contacteren'],
['Numéro de téléphone','Phone number','رقم الهاتف','Número de teléfono','Número de telefone','Telefonnummer','Telefoonnummer'],
['Utilisateur WakhReek','WakhReek user','مستخدم WakhReek','Usuario WakhReek','Usuário WakhReek','WakhReek-Benutzer','WakhReek-gebruiker'],
['Contacter','Contact','تواصل','Contactar','Contatar','Kontaktieren','Contact opnemen'],
['Tapez le numéro puis appuyez sur recherche.','Enter the number then press search.','اكتب الرقم ثم اضغط على البحث.','Escribe el número y pulsa buscar.','Digite o número e pressione pesquisar.','Nummer eingeben und auf Suchen drücken.','Voer het nummer in en druk op zoeken.'],
['Toutes','All','الكل','Todas','Todas','Alle','Alle'],
['Contacts','Contacts','جهات الاتصال','Contactos','Contatos','Kontakte','Contacten'],
['Groupes','Groups','المجموعات','Grupos','Grupos','Gruppen','Groepen'],
['Aucune conversation','No conversation','لا توجد محادثات','Ninguna conversación','Nenhuma conversa','Keine Unterhaltung','Geen gesprek'],
['Vos messages personnels sont','Your personal messages are','رسائلك الشخصية','Tus mensajes personales están','Suas mensagens pessoais estão','Deine persönlichen Nachrichten sind','Je persoonlijke berichten zijn'],
['protégés','protected','محمية','protegidos','protegidas','geschützt','beveiligd'],
['Choisissez un contact','Choose a contact','اختر جهة اتصال','Elige un contacto','Escolha um contato','Kontakt auswählen','Kies een contact'],
['Choisissez une discussion pour commencer.','Choose a conversation to begin.','اختر محادثة للبدء.','Elige una conversación para empezar.','Escolha uma conversa para começar.','Wähle eine Unterhaltung, um zu beginnen.','Kies een gesprek om te beginnen.'],
['Choisissez une conversation','Choose a conversation','اختر محادثة','Elige una conversación','Escolha uma conversa','Unterhaltung auswählen','Kies een gesprek'],
['Message vocal','Voice message','رسالة صوتية','Mensaje de voz','Mensagem de voz','Sprachnachricht','Spraakbericht'],
['Envoi de l’image…','Sending image…','جارٍ إرسال الصورة…','Enviando imagen…','Enviando imagem…','Bild wird gesendet…','Afbeelding verzenden…'],
['Enregistrement…','Recording…','جارٍ التسجيل…','Grabando…','Gravando…','Aufnahme…','Opnemen…'],
['Envoi du vocal…','Sending voice message…','جارٍ إرسال الرسالة الصوتية…','Enviando audio…','Enviando áudio…','Sprachnachricht wird gesendet…','Spraakbericht verzenden…'],
['Appel vidéo entrant','Incoming video call','مكالمة فيديو واردة','Videollamada entrante','Chamada de vídeo recebida','Eingehender Videoanruf','Inkomende videogesprek'],
['Appel audio entrant','Incoming audio call','مكالمة صوتية واردة','Llamada de audio entrante','Chamada de áudio recebida','Eingehender Audioanruf','Inkomende audiogesprek'],
['Appel WakhReek','WakhReek call','مكالمة WakhReek','Llamada WakhReek','Chamada WakhReek','WakhReek-Anruf','WakhReek-oproep'],
['Appel audio…','Audio call…','مكالمة صوتية…','Llamada de audio…','Chamada de áudio…','Audioanruf…','Audiogesprek…'],
['Appel vidéo…','Video call…','مكالمة فيديو…','Videollamada…','Chamada de vídeo…','Videoanruf…','Videogesprek…'],
['Préparation…','Preparing…','جارٍ التحضير…','Preparando…','Preparando…','Vorbereitung…','Voorbereiden…'],
['Connexion…','Connecting…','جارٍ الاتصال…','Conectando…','Conectando…','Verbindung…','Verbinden…'],
['Connecté ✅','Connected ✅','متصل ✅','Conectado ✅','Conectado ✅','Verbunden ✅','Verbonden ✅'],
['Connecté','Connected','متصل','Conectado','Conectado','Verbunden','Verbonden'],
['Connexion terminée','Connection ended','انتهى الاتصال','Conexión terminada','Conexão encerrada','Verbindung beendet','Verbinding beëindigd'],
['Appel non supporté sur cet appareil.','Calls are not supported on this device.','المكالمات غير مدعومة على هذا الجهاز.','Las llamadas no son compatibles con este dispositivo.','Chamadas não são suportadas neste dispositivo.','Anrufe werden auf diesem Gerät nicht unterstützt.','Oproepen worden niet ondersteund op dit apparaat.'],
['Autorisez le microphone et la caméra.','Allow microphone and camera access.','اسمح بالوصول إلى الميكروفون والكاميرا.','Permite el acceso al micrófono y la cámara.','Permita acesso ao microfone e à câmera.','Mikrofon und Kamera zulassen.','Sta microfoon en camera toe.'],
['Ami supprimé.','Contact removed.','تم حذف جهة الاتصال.','Contacto eliminado.','Contato removido.','Kontakt entfernt.','Contact verwijderd.'],

['Marché','Market','السوق','Mercado','Mercado','Markt','Markt'],
['Rechercher des boutiques, produits...','Search shops, products...','ابحث عن متاجر أو منتجات...','Buscar tiendas, productos...','Pesquisar lojas, produtos...','Shops und Produkte suchen...','Zoek winkels, producten...'],
['Ma boutique','My shop','متجري','Mi tienda','Minha loja','Mein Shop','Mijn winkel'],
['Boutiques','Shops','المتاجر','Tiendas','Lojas','Shops','Winkels'],
['Produits','Products','المنتجات','Productos','Produtos','Produkte','Producten'],
['Catégories','Categories','الفئات','Categorías','Categorias','Kategorien','Categorieën'],
['Promotions','Promotions','العروض','Promociones','Promoções','Angebote','Aanbiedingen'],
['Nouveautés','New arrivals','الجديد','Novedades','Novidades','Neuheiten','Nieuw'],
['Top ventes','Best sellers','الأكثر مبيعاً','Más vendidos','Mais vendidos','Bestseller','Best verkocht'],
['Publicité et commerce WakhReek','WakhReek advertising and commerce','إعلانات وتجارة WakhReek','Publicidad y comercio WakhReek','Publicidade e comércio WakhReek','WakhReek Werbung und Handel','WakhReek reclame en handel'],
['Votre marché :','Your market:','سوقك:','Tu mercado:','Seu mercado:','Ihr Markt:','Uw markt:'],
['Afrique du Nord','North Africa','شمال أفريقيا','África del Norte','Norte da África','Nordafrika','Noord-Afrika'],
['CEDEAO / ECOWAS','ECOWAS','إيكواس / سيدياو','CEDEAO / ECOWAS','CEDEAO / ECOWAS','ECOWAS','ECOWAS'],
['Médecine traditionnelle','Traditional medicine','الطب التقليدي','Medicina tradicional','Medicina tradicional','Traditionelle Medizin','Traditionele geneeskunde'],
['Artisanat marocain','Moroccan crafts','الصناعة التقليدية المغربية','Artesanía marroquí','Artesanato marroquino','Marokkanisches Kunsthandwerk','Marokkaans handwerk'],
['Beauté & Bien-être','Beauty & Wellness','الجمال والعافية','Belleza y bienestar','Beleza e bem-estar','Schönheit & Wellness','Schoonheid & welzijn'],
['Bijoux & Accessoires','Jewelry & Accessories','المجوهرات والإكسسوارات','Joyas y accesorios','Joias e acessórios','Schmuck & Accessoires','Sieraden & accessoires'],
['Maison & Décoration','Home & Decor','المنزل والديكور','Hogar y decoración','Casa e decoração','Haus & Dekoration','Wonen & decoratie'],
['Mode & Vêtements','Fashion & Clothing','الموضة والملابس','Moda y ropa','Moda e roupas','Mode & Kleidung','Mode & kleding'],
['Électronique','Electronics','الإلكترونيات','Electrónica','Eletrônicos','Elektronik','Elektronica'],
['Alimentation','Food','الغذاء','Alimentación','Alimentação','Lebensmittel','Voeding'],
['Livres & Éducation','Books & Education','الكتب والتعليم','Libros y educación','Livros e educação','Bücher & Bildung','Boeken & onderwijs'],
['Vendez sur WakhReek','Sell on WakhReek','بِع على WakhReek','Vende en WakhReek','Venda no WakhReek','Auf WakhReek verkaufen','Verkoop op WakhReek'],
['Louez votre espace boutique, publiez vos produits et répondez à vos clients.','Rent your shop space, publish products and reply to customers.','استأجر مساحة متجرك وانشر منتجاتك ورد على زبائنك.','Alquila tu espacio, publica productos y responde a clientes.','Alugue seu espaço, publique produtos e responda aos clientes.','Shopfläche mieten, Produkte veröffentlichen und Kunden antworten.','Huur winkelruimte, publiceer producten en antwoord klanten.'],
['Créer une boutique','Create a shop','إنشاء متجر','Crear una tienda','Criar uma loja','Shop erstellen','Winkel maken'],
['Gérer ma boutique','Manage my shop','إدارة متجري','Gestionar mi tienda','Gerir minha loja','Meinen Shop verwalten','Mijn winkel beheren'],
['Des boutiques réelles, validées et capables de servir leurs clients.','Real, verified shops ready to serve customers.','متاجر حقيقية وموثقة وقادرة على خدمة زبنائها.','Tiendas reales y verificadas listas para atender a sus clientes.','Lojas reais e verificadas prontas para atender clientes.','Echte, geprüfte Shops, die ihre Kunden bedienen können.','Echte, geverifieerde winkels die klanten kunnen bedienen.'],
['Découvrir les boutiques','Discover shops','اكتشف المتاجر','Descubrir tiendas','Descobrir lojas','Shops entdecken','Winkels ontdekken'],
['Boutiques actives sur WakhReek','Active shops on WakhReek','المتاجر النشطة على WakhReek','Tiendas activas en WakhReek','Lojas ativas no WakhReek','Aktive Shops auf WakhReek','Actieve winkels op WakhReek'],
['Boutiques actives','Active shops','المتاجر النشطة','Tiendas activas','Lojas ativas','Aktive Shops','Actieve winkels'],
['Aucune boutique active pour le moment.','No active shop at the moment.','لا توجد متاجر نشطة حالياً.','No hay tiendas activas por el momento.','Nenhuma loja ativa no momento.','Derzeit kein aktiver Shop.','Momenteel geen actieve winkel.'],
['Voici les boutiques actives des autres marchés.','Here are active shops from other markets.','هذه هي المتاجر النشطة في الأسواق الأخرى.','Estas son las tiendas activas de otros mercados.','Estas são as lojas ativas de outros mercados.','Hier sind aktive Shops aus anderen Märkten.','Hier zijn actieve winkels uit andere markten.'],
['Boutique physique','Physical shop','متجر فعلي','Tienda física','Loja física','Physischer Shop','Fysieke winkel'],
['Boutique en ligne','Online shop','متجر إلكتروني','Tienda en línea','Loja online','Online-Shop','Online winkel'],
['Physique + en ligne','Physical + online','فعلي + إلكتروني','Física + en línea','Física + online','Physisch + online','Fysiek + online'],
['Boutique WakhReek','WakhReek shop','متجر WakhReek','Tienda WakhReek','Loja WakhReek','WakhReek-Shop','WakhReek-winkel'],
['Entrer dans la boutique →','Enter shop →','دخول المتجر ←','Entrar en la tienda →','Entrar na loja →','Shop betreten →','Winkel openen →'],
['Boutiques validées','Verified shops','متاجر موثقة','Tiendas verificadas','Lojas verificadas','Verifizierte Shops','Geverifieerde winkels'],
['Seules les boutiques activées par WakhReek sont ouvertes au public.','Only shops activated by WakhReek are open to the public.','فقط المتاجر التي فعّلها WakhReek مفتوحة للجمهور.','Solo las tiendas activadas por WakhReek están abiertas al público.','Somente lojas ativadas pelo WakhReek ficam abertas ao público.','Nur von WakhReek aktivierte Shops sind öffentlich.','Alleen door WakhReek geactiveerde winkels zijn openbaar.'],
['Contact client','Customer contact','تواصل الزبون','Contacto con clientes','Contato com cliente','Kundenkontakt','Klantcontact'],
['Entrez dans une boutique pour consulter ses produits et lui envoyer une demande.','Enter a shop to view products and contact it.','ادخل إلى متجر لمشاهدة منتجاته والتواصل معه.','Entra en una tienda para ver sus productos y contactarla.','Entre em uma loja para ver produtos e entrar em contato.','Shop öffnen, Produkte ansehen und Kontakt aufnehmen.','Ga een winkel binnen om producten te bekijken en contact op te nemen.'],
['Espace vendeur','Seller area','فضاء البائع','Área del vendedor','Área do vendedor','Verkäuferbereich','Verkopersgedeelte'],
['Le vendeur gère ses produits, ses prix et répond aux clients depuis son espace.','The seller manages products, prices and customer replies from this area.','يدير البائع منتجاته وأسعاره ويرد على الزبائن من فضائه.','El vendedor gestiona productos, precios y respuestas desde su espacio.','O vendedor gerencia produtos, preços e clientes em sua área.','Der Verkäufer verwaltet Produkte, Preise und Kundenantworten.','De verkoper beheert producten, prijzen en klantreacties.'],

['Location d’un espace commercial sur WakhReek Market','Rent a commercial space on WakhReek Market','استئجار مساحة تجارية على WakhReek Market','Alquiler de un espacio comercial en WakhReek Market','Aluguel de espaço comercial no WakhReek Market','Gewerbefläche auf WakhReek Market mieten','Commerciële ruimte huren op WakhReek Market'],
['Principe WakhReek','WakhReek principle','مبدأ WakhReek','Principio WakhReek','Princípio WakhReek','WakhReek-Prinzip','WakhReek-principe'],
['WakhReek loue l’espace de la boutique. Le vendeur reste libre de ses produits, photos, descriptions et prix de vente. Ses bénéfices ou pertes lui appartiennent. La plateforme applique seulement les limites et services de la formule choisie.','WakhReek rents the shop space. The seller remains free to manage products, photos, descriptions and selling prices. Profit or loss belongs to the seller. The platform only applies the limits and services of the selected plan.','تؤجر WakhReek مساحة المتجر. يبقى البائع حراً في منتجاته وصوره وأوصافه وأسعار البيع. أرباحه أو خسائره تخصه. تطبق المنصة فقط حدود وخدمات الخطة المختارة.','WakhReek alquila el espacio de la tienda. El vendedor mantiene libertad sobre productos, fotos, descripciones y precios. Sus ganancias o pérdidas le pertenecen. La plataforma solo aplica los límites y servicios del plan elegido.','WakhReek aluga o espaço da loja. O vendedor continua livre para gerir produtos, fotos, descrições e preços. Lucros ou perdas pertencem ao vendedor. A plataforma aplica apenas os limites e serviços do plano escolhido.','WakhReek vermietet die Shopfläche. Der Verkäufer bleibt bei Produkten, Fotos, Beschreibungen und Preisen frei. Gewinne oder Verluste liegen bei ihm. Die Plattform wendet nur Grenzen und Leistungen des gewählten Plans an.','WakhReek verhuurt de winkelruimte. De verkoper blijft vrij in producten, foto’s, beschrijvingen en prijzen. Winst of verlies is voor de verkoper. Het platform past alleen de limieten en diensten van het gekozen plan toe.'],
['1. Informations générales','1. General information','1. معلومات عامة','1. Información general','1. Informações gerais','1. Allgemeine Informationen','1. Algemene informatie'],
['Nom de la boutique','Shop name','اسم المتجر','Nombre de la tienda','Nome da loja','Shopname','Winkelnaam'],
['Nom de votre boutique','Your shop name','اسم متجرك','Nombre de tu tienda','Nome da sua loja','Name Ihres Shops','Naam van je winkel'],
['Description','Description','الوصف','Descripción','Descrição','Beschreibung','Beschrijving'],
['Présentez votre activité','Describe your business','عرّف بنشاطك','Describe tu actividad','Apresente sua atividade','Beschreiben Sie Ihr Geschäft','Beschrijf je activiteit'],
['2. Localisation et type','2. Location and type','2. الموقع والنوع','2. Ubicación y tipo','2. Localização e tipo','2. Standort und Typ','2. Locatie en type'],
['Pays','Country','البلد','País','País','Land','Land'],
['Ville','City','المدينة','Ciudad','Cidade','Stadt','Stad'],
['Type de boutique','Shop type','نوع المتجر','Tipo de tienda','Tipo de loja','Shoptyp','Winkeltype'],
['Les deux','Both','كلاهما','Ambas','Ambas','Beides','Beide'],
['Même grille CFA que le Sénégal.','Same CFA pricing as Senegal.','نفس تسعيرة الفرنك CFA المعتمدة في السنغال.','Misma tarifa CFA que Senegal.','Mesma tabela CFA do Senegal.','Gleiche CFA-Preise wie im Senegal.','Dezelfde CFA-prijzen als Senegal.'],
['Grille internationale en USD, calculée depuis le tarif de référence du Sénégal.','International USD pricing calculated from Senegal reference pricing.','تسعيرة دولية بالدولار محسوبة انطلاقاً من السعر المرجعي في السنغال.','Tarifa internacional en USD calculada desde la referencia de Senegal.','Tabela internacional em USD calculada a partir da referência do Senegal.','Internationale USD-Preise auf Basis des Senegal-Referenzpreises.','Internationale USD-prijzen op basis van de Senegal-referentie.'],
['3. Formule de location','3. Rental plan','3. خطة الإيجار','3. Plan de alquiler','3. Plano de aluguel','3. Miettarif','3. Huurplan'],
['Choisissez le nombre de produits que votre boutique pourra afficher.','Choose how many products your shop can display.','اختر عدد المنتجات التي يمكن لمتجرك عرضها.','Elige cuántos productos puede mostrar tu tienda.','Escolha quantos produtos sua loja pode exibir.','Wählen Sie, wie viele Produkte Ihr Shop anzeigen kann.','Kies hoeveel producten je winkel kan tonen.'],
['Produits illimités','Unlimited products','منتجات غير محدودة','Productos ilimitados','Produtos ilimitados','Unbegrenzte Produkte','Onbeperkte producten'],
['Jusqu’à','Up to','حتى','Hasta','Até','Bis zu','Tot'],
['Entreprises / toutes les fonctionnalités','Companies / all features','الشركات / جميع المزايا','Empresas / todas las funciones','Empresas / todos os recursos','Unternehmen / alle Funktionen','Bedrijven / alle functies'],
['4. Services de la formule','4. Plan services','4. خدمات الخطة','4. Servicios del plan','4. Serviços do plano','4. Leistungen des Plans','4. Diensten van het plan'],
['Formule Entreprise complète','Complete Company plan','خطة الشركات الكاملة','Plan Empresa completo','Plano Empresa completo','Kompletter Unternehmensplan','Volledig bedrijfsplan'],
['Produits illimités + publicité + agent IA + toutes les fonctionnalités WakhReek Market.','Unlimited products + advertising + AI agent + all WakhReek Market features.','منتجات غير محدودة + إعلانات + وكيل ذكاء اصطناعي + جميع مزايا WakhReek Market.','Productos ilimitados + publicidad + agente IA + todas las funciones de WakhReek Market.','Produtos ilimitados + publicidade + agente de IA + todos os recursos do WakhReek Market.','Unbegrenzte Produkte + Werbung + KI-Agent + alle WakhReek-Market-Funktionen.','Onbeperkte producten + reclame + AI-agent + alle WakhReek Market-functies.'],
['Location seulement','Rental only','الإيجار فقط','Solo alquiler','Somente aluguel','Nur Miete','Alleen huur'],
['Location + publicité + IA','Rental + advertising + AI','إيجار + إعلانات + ذكاء اصطناعي','Alquiler + publicidad + IA','Aluguel + publicidade + IA','Miete + Werbung + KI','Huur + reclame + AI'],
['Location + publicité','Rental + advertising','إيجار + إعلانات','Alquiler + publicidad','Aluguel + publicidade','Miete + Werbung','Huur + reclame'],
['5. Gestion du stock','5. Stock management','5. إدارة المخزون','5. Gestión de inventario','5. Gestão de estoque','5. Lagerverwaltung','5. Voorraadbeheer'],
['Le stock n’est pas une obligation commerciale imposée par WakhReek.','Stock tracking is not a commercial requirement imposed by WakhReek.','إدارة المخزون ليست التزاماً تجارياً تفرضه WakhReek.','El inventario no es una obligación comercial impuesta por WakhReek.','O estoque não é uma obrigação comercial imposta pelo WakhReek.','Lagerführung ist keine von WakhReek vorgeschriebene Pflicht.','Voorraadbeheer is geen commerciële verplichting van WakhReek.'],
['Je veux indiquer et gérer les quantités en stock','I want to show and manage stock quantities','أريد عرض وإدارة كميات المخزون','Quiero indicar y gestionar las cantidades en stock','Quero informar e gerir as quantidades em estoque','Ich möchte Lagerbestände anzeigen und verwalten','Ik wil voorraadhoeveelheden tonen en beheren'],
['Je préfère ne pas communiquer mon stock','I prefer not to show my stock','أفضل عدم إظهار مخزوني','Prefiero no mostrar mi inventario','Prefiro não informar meu estoque','Ich möchte meinen Bestand nicht anzeigen','Ik toon mijn voorraad liever niet'],
['Formule choisie','Selected plan','الخطة المختارة','Plan elegido','Plano escolhido','Gewählter Plan','Gekozen plan'],
['Services','Services','الخدمات','Servicios','Serviços','Leistungen','Diensten'],
['Toutes fonctionnalités','All features','جميع المزايا','Todas las funciones','Todos os recursos','Alle Funktionen','Alle functies'],
['Publicité + IA','Advertising + AI','إعلانات + ذكاء اصطناعي','Publicidad + IA','Publicidade + IA','Werbung + KI','Reclame + AI'],
['Publicité','Advertising','إعلانات','Publicidad','Publicidade','Werbung','Reclame'],
['Total mensuel','Monthly total','الإجمالي الشهري','Total mensual','Total mensal','Monatssumme','Maandtotaal'],
['Référence:','Reference:','المرجع:','Referencia:','Referência:','Referenz:','Referentie:'],
['Après soumission, un abonnement en attente est créé. La boutique reste inactive jusqu’au paiement et à sa validation.','After submission, a pending subscription is created. The shop stays inactive until payment and approval.','بعد الإرسال يتم إنشاء اشتراك قيد الانتظار. يبقى المتجر غير نشط حتى الدفع والموافقة.','Tras enviar, se crea una suscripción pendiente. La tienda permanece inactiva hasta el pago y la aprobación.','Após o envio, uma assinatura pendente é criada. A loja fica inativa até pagamento e aprovação.','Nach dem Absenden wird ein ausstehendes Abo erstellt. Der Shop bleibt bis Zahlung und Freigabe inaktiv.','Na indienen wordt een wachtend abonnement gemaakt. De winkel blijft inactief tot betaling en goedkeuring.'],
['Soumettre la demande de boutique','Submit shop request','إرسال طلب المتجر','Enviar solicitud de tienda','Enviar solicitação da loja','Shop-Anfrage senden','Winkelaanvraag indienen'],
['Enregistrement...','Saving...','جارٍ الحفظ...','Guardando...','Salvando...','Speichern...','Opslaan...'],

['ESPACE VENDEUR WAKHREEK','WAKHREEK SELLER AREA','فضاء بائع WAKHREEK','ÁREA VENDEDOR WAKHREEK','ÁREA DO VENDEDOR WAKHREEK','WAKHREEK VERKÄUFERBEREICH','WAKHREEK VERKOPERSGEDEELTE'],
['Boutique active et visible','Shop active and visible','المتجر نشط ومرئي','Tienda activa y visible','Loja ativa e visível','Shop aktiv und sichtbar','Winkel actief en zichtbaar'],
['En attente de validation','Pending approval','قيد الموافقة','Pendiente de aprobación','Aguardando aprovação','Wartet auf Freigabe','Wacht op goedkeuring'],
['Communications boutique','Shop communications','تواصل المتجر','Comunicaciones de la tienda','Comunicações da loja','Shop-Kommunikation','Winkelcommunicatie'],
['Voir ma boutique','View my shop','عرض متجري','Ver mi tienda','Ver minha loja','Meinen Shop ansehen','Mijn winkel bekijken'],
['Produits publiés','Published products','المنتجات المنشورة','Productos publicados','Produtos publicados','Veröffentlichte Produkte','Gepubliceerde producten'],
['Limite du plan','Plan limit','حد الخطة','Límite del plan','Limite do plano','Planlimit','Planlimiet'],
['Propriétaire','Owner','المالك','Propietario','Proprietário','Inhaber','Eigenaar'],
['Messages boutique reçus','Shop messages received','رسائل المتجر المستلمة','Mensajes de tienda recibidos','Mensagens da loja recebidas','Empfangene Shop-Nachrichten','Ontvangen winkelberichten'],
['Envoyer une vidéo publicitaire courte pour validation avant diffusion, ou préparer une demande de création par Division Publicité.','Send an advertising video for approval before broadcast, or prepare a creation request for the Advertising Division.','أرسل فيديو إعلانياً للموافقة قبل البث، أو جهّز طلب إنشاء لدى قسم الإعلانات.','Envía un video publicitario para aprobación antes de emitirlo, o prepara una solicitud de creación para la División de Publicidad.','Envie um vídeo publicitário para aprovação antes da exibição, ou prepare um pedido de criação para a Divisão de Publicidade.','Werbevideo vor Ausstrahlung zur Freigabe senden oder Erstellung durch die Werbeabteilung anfragen.','Stuur een reclamevideo ter goedkeuring vóór uitzending of vraag creatie aan bij de advertentieafdeling.'],
['Gérer mes publicités','Manage my ads','إدارة إعلاناتي','Gestionar mis anuncios','Gerir meus anúncios','Meine Anzeigen verwalten','Mijn advertenties beheren'],
['Communication de la boutique','Shop communication','تواصل المتجر','Comunicación de la tienda','Comunicação da loja','Shop-Kommunikation','Winkelcommunicatie'],
['Cette fenêtre appartient au magasin. Elle est séparée de Communication personnelle WakhReek.','This window belongs to the shop. It is separate from personal WakhReek Communication.','هذه النافذة خاصة بالمتجر ومنفصلة عن تواصل WakhReek الشخصي.','Esta ventana pertenece a la tienda y está separada de la comunicación personal WakhReek.','Esta janela pertence à loja e é separada da comunicação pessoal WakhReek.','Dieses Fenster gehört zum Shop und ist von der persönlichen WakhReek-Kommunikation getrennt.','Dit venster hoort bij de winkel en staat los van persoonlijke WakhReek-communicatie.'],
['Ouvrir les communications','Open communications','فتح التواصل','Abrir comunicaciones','Abrir comunicações','Kommunikation öffnen','Communicatie openen'],
['Identité du propriétaire','Owner identity','هوية المالك','Identidad del propietario','Identidade do proprietário','Inhaberidentität','Identiteit van eigenaar'],
['Le propriétaire choisit le nom affiché, sa fonction et sa propre photo.','The owner chooses the displayed name, role and photo.','يختار المالك الاسم المعروض ووظيفته وصورته.','El propietario elige el nombre mostrado, su función y su foto.','O proprietário escolhe o nome exibido, função e foto.','Der Inhaber wählt Anzeigename, Funktion und Foto.','De eigenaar kiest weergavenaam, functie en foto.'],
['Nom du propriétaire','Owner name','اسم المالك','Nombre del propietario','Nome do proprietário','Name des Inhabers','Naam van eigenaar'],
['Fonction / métier','Role / profession','الوظيفة / المهنة','Función / profesión','Função / profissão','Funktion / Beruf','Functie / beroep'],
['Photo du propriétaire / image choisie','Owner photo / selected image','صورة المالك / الصورة المختارة','Foto del propietario / imagen elegida','Foto do proprietário / imagem escolhida','Inhaberfoto / gewähltes Bild','Foto eigenaar / gekozen afbeelding'],
['JPG, PNG ou WEBP — maximum 5 Mo','JPG, PNG or WEBP — max 5 MB','JPG أو PNG أو WEBP — الحد الأقصى 5 ميغابايت','JPG, PNG o WEBP — máximo 5 MB','JPG, PNG ou WEBP — máximo 5 MB','JPG, PNG oder WEBP — maximal 5 MB','JPG, PNG of WEBP — maximaal 5 MB'],
['Enregistrer mon identité','Save my identity','حفظ هويتي','Guardar mi identidad','Salvar minha identidade','Meine Identität speichern','Mijn identiteit opslaan'],
['Ajouter un produit','Add a product','إضافة منتج','Añadir un producto','Adicionar um produto','Produkt hinzufügen','Product toevoegen'],
['Nom du produit','Product name','اسم المنتج','Nombre del producto','Nome do produto','Produktname','Productnaam'],
['Catégorie','Category','الفئة','Categoría','Categoria','Kategorie','Categorie'],
['Prix','Price','السعر','Precio','Preço','Preis','Prijs'],
['Stock (facultatif)','Stock (optional)','المخزون (اختياري)','Inventario (opcional)','Estoque (opcional)','Bestand (optional)','Voorraad (optioneel)'],
['Photo du produit','Product photo','صورة المنتج','Foto del producto','Foto do produto','Produktfoto','Productfoto'],
['Publier le produit','Publish product','نشر المنتج','Publicar producto','Publicar produto','Produkt veröffentlichen','Product publiceren'],
['Mes produits','My products','منتجاتي','Mis productos','Meus produtos','Meine Produkte','Mijn producten'],
['Stock non déclaré','Stock not declared','المخزون غير معلن','Inventario no declarado','Estoque não informado','Bestand nicht angegeben','Voorraad niet opgegeven'],
['Stock:','Stock:','المخزون:','Inventario:','Estoque:','Bestand:','Voorraad:'],
['Supprimer','Delete','حذف','Eliminar','Excluir','Löschen','Verwijderen'],

['Boutique indisponible','Shop unavailable','المتجر غير متاح','Tienda no disponible','Loja indisponível','Shop nicht verfügbar','Winkel niet beschikbaar'],
['PROPRIÉTAIRE DE LA BOUTIQUE','SHOP OWNER','مالك المتجر','PROPIETARIO DE LA TIENDA','PROPRIETÁRIO DA LOJA','SHOP-INHABER','WINKEL-EIGENAAR'],
['Boutique :','Shop:','المتجر:','Tienda:','Loja:','Shop:','Winkel:'],
['Bienvenue dans cette boutique WakhReek.','Welcome to this WakhReek shop.','مرحباً بك في متجر WakhReek هذا.','Bienvenido a esta tienda WakhReek.','Bem-vindo a esta loja WakhReek.','Willkommen in diesem WakhReek-Shop.','Welkom in deze WakhReek-winkel.'],
['Validée','Verified','موثقة','Verificada','Verificada','Verifiziert','Geverifieerd'],
['Fenêtre contact boutique','Shop contact window','نافذة تواصل المتجر','Ventana de contacto de tienda','Janela de contato da loja','Shop-Kontaktfenster','Winkelcontactvenster'],
['Aucun produit pour le moment.','No products at the moment.','لا توجد منتجات حالياً.','No hay productos por el momento.','Nenhum produto no momento.','Derzeit keine Produkte.','Momenteel geen producten.'],
['Rupture de stock','Out of stock','نفد المخزون','Agotado','Sem estoque','Ausverkauft','Uitverkocht'],

['Aucun interlocuteur sélectionné.','No contact selected.','لم يتم اختيار أي جهة اتصال.','Ningún contacto seleccionado.','Nenhum contato selecionado.','Kein Gesprächspartner ausgewählt.','Geen contact geselecteerd.'],
['Type de fichier invalide.','Invalid file type.','نوع الملف غير صالح.','Tipo de archivo no válido.','Tipo de arquivo inválido.','Ungültiger Dateityp.','Ongeldig bestandstype.'],
['Envoi du message vocal…','Sending voice message…','جارٍ إرسال الرسالة الصوتية…','Enviando mensaje de voz…','Enviando mensagem de voz…','Sprachnachricht wird gesendet…','Spraakbericht verzenden…'],
['Message vocal envoyé.','Voice message sent.','تم إرسال الرسالة الصوتية.','Mensaje de voz enviado.','Mensagem de voz enviada.','Sprachnachricht gesendet.','Spraakbericht verzonden.'],
['Connectez-vous pour enregistrer.','Sign in to record.','سجّل الدخول للتسجيل.','Inicia sesión para grabar.','Entre para gravar.','Zum Aufnehmen anmelden.','Log in om op te nemen.'],
['Enregistrement audio non supporté par ce navigateur.','Audio recording is not supported by this browser.','تسجيل الصوت غير مدعوم في هذا المتصفح.','Este navegador no admite grabación de audio.','Este navegador não suporta gravação de áudio.','Audioaufnahme wird von diesem Browser nicht unterstützt.','Audio-opname wordt niet ondersteund door deze browser.'],
['Enregistrement… appuyez encore pour envoyer.','Recording… press again to send.','جارٍ التسجيل… اضغط مرة أخرى للإرسال.','Grabando… pulsa de nuevo para enviar.','Gravando… pressione novamente para enviar.','Aufnahme… erneut drücken zum Senden.','Opnemen… druk opnieuw om te verzenden.'],
['Autorisez le microphone pour enregistrer.','Allow microphone access to record.','اسمح بالوصول إلى الميكروفون للتسجيل.','Permite el micrófono para grabar.','Permita o microfone para gravar.','Mikrofon zum Aufnehmen zulassen.','Sta de microfoon toe om op te nemen.'],
['Préparation de l’appel…','Preparing the call…','جارٍ تحضير المكالمة…','Preparando la llamada…','Preparando a chamada…','Anruf wird vorbereitet…','Oproep voorbereiden…'],
['Appel en cours…','Call in progress…','المكالمة جارية…','Llamada en curso…','Chamada em andamento…','Anruf läuft…','Oproep bezig…'],
['Appel connecté.','Call connected.','تم اتصال المكالمة.','Llamada conectada.','Chamada conectada.','Anruf verbunden.','Oproep verbonden.'],
['Appel refusé.','Call declined.','تم رفض المكالمة.','Llamada rechazada.','Chamada recusada.','Anruf abgelehnt.','Oproep geweigerd.'],
['Appel terminé.','Call ended.','انتهت المكالمة.','Llamada terminada.','Chamada encerrada.','Anruf beendet.','Oproep beëindigd.'],
['Message','Message','رسالة','Mensaje','Mensagem','Nachricht','Bericht'],
['Photo','Photo','صورة','Foto','Foto','Foto','Foto'],
['Audio','Audio','صوت','Audio','Áudio','Audio','Audio'],
['Vidéo','Video','فيديو','Video','Vídeo','Video','Video'],
['Appel','Call','مكالمة','Llamada','Chamada','Anruf','Oproep'],
['Visio','Video call','مكالمة فيديو','Videollamada','Videochamada','Videoanruf','Videogesprek'],
['Terminer','End','إنهاء','Terminar','Encerrar','Beenden','Beëindigen'],
['Écrire un message...','Write a message...','اكتب رسالة...','Escribe un mensaje...','Escreva uma mensagem...','Nachricht schreiben...','Schrijf een bericht...'],
['Envoyer','Send','إرسال','Enviar','Enviar','Senden','Verzenden'],
['Accepter','Accept','قبول','Aceptar','Aceitar','Annehmen','Accepteren'],
['Refuser','Decline','رفض','Rechazar','Recusar','Ablehnen','Weigeren'],

['ESPACE PUBLICITÉ BOUTIQUE','SHOP ADVERTISING AREA','فضاء إعلانات المتجر','ÁREA DE PUBLICIDAD DE TIENDA','ÁREA DE PUBLICIDADE DA LOJA','SHOP-WERBEBEREICH','WINKELADVERTENTIERUIMTE'],
['les publicités passent par validation avant diffusion.','ads require approval before broadcast.','تمر الإعلانات بالموافقة قبل البث.','los anuncios requieren aprobación antes de emitirse.','os anúncios passam por aprovação antes da exibição.','Werbung muss vor der Ausstrahlung freigegeben werden.','advertenties moeten worden goedgekeurd vóór uitzending.'],
['Créer une publicité','Create an ad','إنشاء إعلان','Crear un anuncio','Criar um anúncio','Anzeige erstellen','Advertentie maken'],
['J’ai ma vidéo','I have my video','لدي الفيديو','Tengo mi video','Tenho meu vídeo','Ich habe mein Video','Ik heb mijn video'],
['Faire créer ma publicité','Have my ad created','إنشاء إعلاني بواسطة الخدمة','Encargar la creación de mi anuncio','Mandar criar meu anúncio','Anzeige erstellen lassen','Mijn advertentie laten maken'],
['Cette option servira au commerçant qui veut confier la création ou le montage de sa publicité à un prestataire dans WakhReek. Nous la gardons séparée jusqu’à l’intégration de Khamsa.','This option is for merchants who want a WakhReek provider to create or edit their ad. It stays separate until Khamsa integration.','هذا الخيار للتاجر الذي يريد إسناد إنشاء أو مونتاج إعلانه إلى مقدم خدمة داخل WakhReek. سيبقى منفصلاً حتى دمج Khamsa.','Esta opción es para comerciantes que quieren encargar la creación o edición del anuncio a un proveedor dentro de WakhReek. Se mantendrá separada hasta integrar Khamsa.','Esta opção é para comerciantes que desejam contratar um prestador dentro do WakhReek para criar ou editar o anúncio. Ficará separada até a integração do Khamsa.','Diese Option ist für Händler, die Erstellung oder Schnitt ihrer Werbung einem Anbieter in WakhReek überlassen möchten. Sie bleibt bis zur Khamsa-Integration getrennt.','Deze optie is voor verkopers die creatie of montage van hun advertentie aan een dienstverlener in WakhReek willen uitbesteden. Ze blijft apart tot Khamsa-integratie.'],
['Titre de la publicité','Ad title','عنوان الإعلان','Título del anuncio','Título do anúncio','Anzeigentitel','Advertentietitel'],
['Description courte (facultatif)','Short description (optional)','وصف قصير (اختياري)','Descripción breve (opcional)','Descrição curta (opcional)','Kurzbeschreibung (optional)','Korte beschrijving (optioneel)'],
['Vidéo publicitaire','Advertising video','فيديو إعلاني','Video publicitario','Vídeo publicitário','Werbevideo','Reclamevideo'],
['Envoyer pour validation','Send for approval','إرسال للموافقة','Enviar para aprobación','Enviar para aprovação','Zur Freigabe senden','Ter goedkeuring verzenden'],
['Mes demandes TV','My TV requests','طلبات التلفاز الخاصة بي','Mis solicitudes TV','Meus pedidos de TV','Meine TV-Anfragen','Mijn TV-aanvragen'],
['Aucune publicité envoyée.','No ad submitted.','لم يتم إرسال أي إعلان.','No se envió ningún anuncio.','Nenhum anúncio enviado.','Keine Werbung eingereicht.','Geen advertentie ingediend.'],
['Sans description','No description','بدون وصف','Sin descripción','Sem descrição','Keine Beschreibung','Geen beschrijving'],
['En attente','Pending','قيد الانتظار','Pendiente','Pendente','Ausstehend','In afwachting'],
['Active','Active','نشط','Activa','Ativa','Aktiv','Actief'],
['Refusée','Rejected','مرفوض','Rechazada','Recusada','Abgelehnt','Afgewezen'],
['En pause','Paused','متوقف مؤقتاً','En pausa','Pausada','Pausiert','Gepauzeerd'],
['Terminée','Ended','منتهٍ','Terminada','Encerrada','Beendet','Beëindigd'],
['Supprimer définitivement','Delete permanently','حذف نهائياً','Eliminar definitivamente','Excluir definitivamente','Dauerhaft löschen','Definitief verwijderen'],

['Découvrir • Regarder • Visiter','Discover • Watch • Visit','اكتشف • شاهد • زر','Descubrir • Ver • Visitar','Descobrir • Assistir • Visitar','Entdecken • Ansehen • Besuchen','Ontdekken • Kijken • Bezoeken'],
['La vitrine vidéo de WakhReek relie la publicité aux boutiques du Market.','WakhReek video showcase connects advertising to Market shops.','واجهة الفيديو في WakhReek تربط الإعلانات بمتاجر السوق.','La vitrina de video de WakhReek conecta la publicidad con las tiendas del Market.','A vitrine de vídeo do WakhReek conecta publicidade às lojas do Market.','Die WakhReek-Videovitrine verbindet Werbung mit Market-Shops.','De WakhReek-videovitrine verbindt reclame met Market-winkels.'],
['Ouvrir Market','Open Market','فتح Market','Abrir Market','Abrir Market','Market öffnen','Market openen'],
['PUBLICITÉ WAKHREEK TV','WAKHREEK TV ADVERTISING','إعلانات WAKHREEK TV','PUBLICIDAD WAKHREEK TV','PUBLICIDADE WAKHREEK TV','WAKHREEK TV WERBUNG','WAKHREEK TV RECLAME'],
['Boutiques • Produits • Marques','Shops • Products • Brands','متاجر • منتجات • علامات','Tiendas • Productos • Marcas','Lojas • Produtos • Marcas','Shops • Produkte • Marken','Winkels • Producten • Merken'],
['PUBLICITÉ','ADVERTISEMENT','إعلان','PUBLICIDAD','PUBLICIDADE','WERBUNG','RECLAME'],
['Voir la boutique →','View shop →','عرض المتجر ←','Ver tienda →','Ver loja →','Shop ansehen →','Winkel bekijken →'],
['WakhReek TV est prêt','WakhReek TV is ready','WakhReek TV جاهز','WakhReek TV está listo','WakhReek TV está pronto','WakhReek TV ist bereit','WakhReek TV is klaar'],
['Les publicités approuvées apparaîtront ici. Aucun faux contenu publicitaire n’est affiché.','Approved ads will appear here. No fake advertising content is shown.','ستظهر الإعلانات المعتمدة هنا. لا يتم عرض أي محتوى إعلاني مزيف.','Los anuncios aprobados aparecerán aquí. No se muestra contenido publicitario falso.','Anúncios aprovados aparecerão aqui. Nenhum conteúdo publicitário falso é exibido.','Freigegebene Werbung erscheint hier. Es werden keine Fake-Anzeigen gezeigt.','Goedgekeurde advertenties verschijnen hier. Er wordt geen nep-reclame getoond.'],
['Boutiques WakhReek','WakhReek shops','متاجر WakhReek','Tiendas WakhReek','Lojas WakhReek','WakhReek-Shops','WakhReek-winkels'],
['Découvrir directement dans Market','Discover directly in Market','اكتشف مباشرة في Market','Descubrir directamente en Market','Descobrir diretamente no Market','Direkt im Market entdecken','Direct ontdekken in Market'],
['Tout voir','View all','عرض الكل','Ver todo','Ver tudo','Alle ansehen','Alles bekijken'],

['Vérification Admin...','Checking Admin access...','جارٍ التحقق من صلاحية الإدارة...','Verificando acceso Admin...','Verificando acesso Admin...','Admin-Zugriff wird geprüft...','Admin-toegang controleren...'],
['Accès Admin protégé','Protected Admin access','دخول الإدارة محمي','Acceso Admin protegido','Acesso Admin protegido','Geschützter Admin-Zugriff','Beveiligde Admin-toegang'],
['Cette page est réservée au compte administrateur WakhReek.','This page is reserved for the WakhReek administrator account.','هذه الصفحة مخصصة لحساب إدارة WakhReek.','Esta página está reservada a la cuenta administradora de WakhReek.','Esta página é reservada à conta administradora WakhReek.','Diese Seite ist dem WakhReek-Administratorkonto vorbehalten.','Deze pagina is voor het WakhReek-beheerdersaccount.'],
['Retour à WakhReek','Back to WakhReek','العودة إلى WakhReek','Volver a WakhReek','Voltar ao WakhReek','Zurück zu WakhReek','Terug naar WakhReek'],
['Gestion protégée des boutiques, abonnements et WakhReek TV','Protected management of shops, subscriptions and WakhReek TV','إدارة محمية للمتاجر والاشتراكات وWakhReek TV','Gestión protegida de tiendas, suscripciones y WakhReek TV','Gestão protegida de lojas, assinaturas e WakhReek TV','Geschützte Verwaltung von Shops, Abos und WakhReek TV','Beveiligd beheer van winkels, abonnementen en WakhReek TV'],
['Actualiser','Refresh','تحديث','Actualizar','Atualizar','Aktualisieren','Vernieuwen'],
['Paiements en attente','Pending payments','مدفوعات قيد الانتظار','Pagos pendientes','Pagamentos pendentes','Ausstehende Zahlungen','Wachtende betalingen'],
['Publicités TV en attente','Pending TV ads','إعلانات TV قيد الانتظار','Anuncios TV pendientes','Anúncios de TV pendentes','Ausstehende TV-Werbung','Wachtende TV-advertenties'],
['Division Publicité — WakhReek TV','Advertising Division — WakhReek TV','قسم الإعلانات — WakhReek TV','División de Publicidad — WakhReek TV','Divisão de Publicidade — WakhReek TV','Werbeabteilung — WakhReek TV','Advertentieafdeling — WakhReek TV'],
['Aucune publicité TV pour le moment.','No TV ads at the moment.','لا توجد إعلانات TV حالياً.','No hay anuncios TV por el momento.','Nenhum anúncio de TV no momento.','Derzeit keine TV-Werbung.','Momenteel geen TV-advertenties.'],
['Approuver / Activer','Approve / Activate','موافقة / تفعيل','Aprobar / Activar','Aprovar / Ativar','Freigeben / Aktivieren','Goedkeuren / Activeren'],
['Pause','Pause','إيقاف مؤقت','Pausa','Pausa','Pause','Pauze'],
['Boutique','Shop','متجر','Tienda','Loja','Shop','Winkel'],
['Plan','Plan','الخطة','Plan','Plano','Plan','Plan'],
['Paiement','Payment','الدفع','Pago','Pagamento','Zahlung','Betaling'],
['Montant','Amount','المبلغ','Importe','Valor','Betrag','Bedrag'],
['État','Status','الحالة','Estado','Estado','Status','Status'],
['Créée le','Created on','تاريخ الإنشاء','Creada el','Criada em','Erstellt am','Aangemaakt op'],
['Actions Admin','Admin actions','إجراءات الإدارة','Acciones Admin','Ações Admin','Admin-Aktionen','Admin-acties'],
['Aucun paiement','No payment','لا توجد دفعة','Sin pago','Sem pagamento','Keine Zahlung','Geen betaling'],
['Inactive','Inactive','غير نشط','Inactiva','Inativa','Inaktiv','Inactief'],
['Activer gratuit','Activate free','تفعيل مجاناً','Activar gratis','Ativar grátis','Kostenlos aktivieren','Gratis activeren'],
['Désactiver','Deactivate','تعطيل','Desactivar','Desativar','Deaktivieren','Deactiveren'],
['Approuver','Approve','موافقة','Aprobar','Aprovar','Freigeben','Goedkeuren'],

['Économique - 15 produits','Economy - 15 products','اقتصادي - 15 منتجاً','Económico - 15 productos','Econômico - 15 produtos','Economy - 15 Produkte','Economy - 15 producten'],
['Professionnel - 45 produits','Professional - 45 products','احترافي - 45 منتجاً','Profesional - 45 productos','Profissional - 45 produtos','Professional - 45 Produkte','Professioneel - 45 producten'],
['Entreprise - illimité','Company - unlimited','شركة - غير محدود','Empresa - ilimitado','Empresa - ilimitado','Unternehmen - unbegrenzt','Bedrijf - onbeperkt'],
['Bénin','Benin','بنين','Benín','Benim','Benin','Benin'],
['Côte d\'Ivoire','Ivory Coast','ساحل العاج','Costa de Marfil','Costa do Marfim','Elfenbeinküste','Ivoorkust'],
['Égypte','Egypt','مصر','Egipto','Egito','Ägypten','Egypte'],
['Gambie','Gambia','غامبيا','Gambia','Gâmbia','Gambia','Gambia'],
['Guinée-Bissau','Guinea-Bissau','غينيا بيساو','Guinea-Bisáu','Guiné-Bissau','Guinea-Bissau','Guinee-Bissau'],
['Guinée','Guinea','غينيا','Guinea','Guiné','Guinea','Guinee'],
['Libéria','Liberia','ليبيريا','Liberia','Libéria','Liberia','Liberia'],
['Libye','Libya','ليبيا','Libia','Líbia','Libyen','Libië'],
['Maroc','Morocco','المغرب','Marruecos','Marrocos','Marokko','Marokko'],
['Mauritanie','Mauritania','موريتانيا','Mauritania','Mauritânia','Mauretanien','Mauritanië'],
['Sénégal','Senegal','السنغال','Senegal','Senegal','Senegal','Senegal'],
['Tunisie','Tunisia','تونس','Túnez','Tunísia','Tunesien','Tunesië']
]

const IDX={fr:0,en:1,ar:2,es:3,pt:4,de:5,nl:6}
const SORTED=[...R].sort((a,b)=>b[0].length-a[0].length)
const textState=new WeakMap(),attrState=new WeakMap()

function convert(input,lang){
 if(!input||lang==='fr')return input
 const idx=IDX[lang]??0
 let out=input
 for(const row of SORTED){if(out.includes(row[0]))out=out.split(row[0]).join(row[idx]||row[0])}
 return out
}

function translateText(node,lang){
 const parent=node.parentElement
 if(!parent||['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','CODE','PRE'].includes(parent.tagName)||parent.closest('.wr-language,[data-no-translate]'))return
 const current=node.nodeValue||''
 let state=textState.get(node)
 if(!state||current!==state.last){state={original:current,last:current};textState.set(node,state)}
 const next=convert(state.original,lang)
 state.last=next
 if(current!==next)node.nodeValue=next
}

function translateAttrs(el,lang){
 if(el.closest?.('.wr-language,[data-no-translate]'))return
 let state=attrState.get(el);if(!state){state={};attrState.set(el,state)}
 for(const name of ['placeholder','title','aria-label']){
  if(!el.hasAttribute?.(name))continue
  const current=el.getAttribute(name)||'',s=state[name]
  if(!s||current!==s.last)state[name]={original:current,last:current}
  const next=convert(state[name].original,lang);state[name].last=next
  if(current!==next)el.setAttribute(name,next)
 }
}

function apply(root,lang){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n
 while((n=walker.nextNode()))translateText(n,lang)
 if(root.querySelectorAll)root.querySelectorAll('*').forEach(el=>translateAttrs(el,lang))
}

export default function PlatformTranslator(){
 useEffect(()=>{
  let lang='fr',queued=false
  try{lang=localStorage.getItem('wakhreek_language')||'fr'}catch{}
  const run=()=>{queued=false;document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';apply(document.body,lang)}
  const queue=()=>{if(!queued){queued=true;requestAnimationFrame(run)}}
  const change=e=>{lang=e.detail?.language||'fr';queue()}
  const observer=new MutationObserver(queue)
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']})
  window.addEventListener('wakhreek-language-change',change)
  queue()
  return()=>{observer.disconnect();window.removeEventListener('wakhreek-language-change',change)}
 },[])
 return null
}
