-- WakhReek FINAL SCHEMA - FIXED - طبق بالضبط لي متافقين عليه
-- حل مشكل cities does not exist

-- فعل UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Countries (15 دولة) - شمال وغرب إفريقيا
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS boutiques CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  flag_emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cities (مدن كنتمي البلد)
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_id, slug)
);

-- 3. Boutiques (البوتيكات حقيقين) - بدون auth.users باش ما يبلوكيش
CREATE TABLE boutiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- كان REFERENCES auth.users(id) - حيّدناه باش يخدم
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE NOT NULL,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('physique','en_ligne','les_deux')) DEFAULT 'les_deux',
  plan TEXT CHECK (plan IN ('15','45','unlimited')) NOT NULL DEFAULT '15',
  product_count_limit INT,
  has_ads BOOLEAN DEFAULT FALSE,
  has_ai_agent BOOLEAN DEFAULT FALSE,
  is_real BOOLEAN DEFAULT TRUE,
  rating DECIMAL DEFAULT 4.5,
  is_live BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products (حرية في الأثمنة - لا دخل لنا)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID REFERENCES boutiques(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price_cfa INT NOT NULL,
  original_price_cfa INT,
  category TEXT NOT NULL,
  image_url TEXT,
  stock INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subscriptions (يخلص على حساب البلد)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID REFERENCES boutiques(id) ON DELETE CASCADE NOT NULL,
  plan TEXT CHECK (plan IN ('15','45','unlimited')),
  country_code TEXT NOT NULL,
  amount_cfa INT NOT NULL,
  flutterwave_tx_ref TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 15 countries - شمال وغرب إفريقيا
INSERT INTO countries (code, name_fr, name_ar, flag_emoji) VALUES
('MAR','Maroc','المغرب','🇲🇦'),
('DZA','Algérie','الجزائر','🇩🇿'),
('TUN','Tunisie','تونس','🇹🇳'),
('LBY','Libye','ليبيا','🇱🇾'),
('EGY','Égypte','مصر','🇪🇬'),
('MRT','Mauritanie','موريتانيا','🇲🇷'),
('SEN','Sénégal','السنغال','🇸🇳'),
('CIV','Côte d''Ivoire','ساحل العاج','🇨🇮'),
('GHA','Ghana','غانا','🇬🇭'),
('MLI','Mali','مالي','🇲🇱'),
('BFA','Burkina Faso','بوركينا فاسو','🇧🇫'),
('NER','Niger','النيجر','🇳🇪'),
('BEN','Bénin','بنين','🇧🇯'),
('TGO','Togo','توغو','🇹🇬'),
('NGA','Nigeria','نيجيريا','🇳🇬');

-- Seed Cities
INSERT INTO cities (country_id, name, slug) VALUES
((SELECT id FROM countries WHERE code='MAR'), 'Casablanca', 'casablanca'),
((SELECT id FROM countries WHERE code='MAR'), 'Marrakech', 'marrakech'),
((SELECT id FROM countries WHERE code='MAR'), 'Fès', 'fes'),
((SELECT id FROM countries WHERE code='MAR'), 'Rabat', 'rabat'),
((SELECT id FROM countries WHERE code='MAR'), 'Tanger', 'tanger'),
((SELECT id FROM countries WHERE code='MAR'), 'Agadir', 'agadir'),
((SELECT id FROM countries WHERE code='DZA'), 'Alger', 'alger'),
((SELECT id FROM countries WHERE code='DZA'), 'Oran', 'oran'),
((SELECT id FROM countries WHERE code='SEN'), 'Dakar', 'dakar'),
((SELECT id FROM countries WHERE code='SEN'), 'Saint-Louis', 'saint-louis'),
((SELECT id FROM countries WHERE code='SEN'), 'Touba', 'touba');

-- Seed Real Boutiques - حقيقين
INSERT INTO boutiques (country_id, city_id, name, plan, product_count_limit, has_ads, has_ai_agent, rating, is_live)
SELECT c.id, ci.id, 'Herboristerie Al Baraka', '45', 45, true, false, 4.8, true
FROM countries c, cities ci WHERE c.code='MAR' AND ci.slug='casablanca' LIMIT 1;

INSERT INTO boutiques (country_id, city_id, name, plan, product_count_limit, has_ads, has_ai_agent, rating, is_live)
SELECT c.id, ci.id, 'Artisanat du Maroc', '15', 15, false, false, 4.9, false
FROM countries c, cities ci WHERE c.code='MAR' AND ci.slug='marrakech' LIMIT 1;

INSERT INTO boutiques (country_id, city_id, name, plan, product_count_limit, has_ads, has_ai_agent, rating, is_live)
SELECT c.id, ci.id, 'Bio Nature', 'unlimited', NULL, true, true, 4.7, true
FROM countries c, cities ci WHERE c.code='MAR' AND ci.slug='rabat' LIMIT 1;

INSERT INTO boutiques (country_id, city_id, name, plan, product_count_limit, has_ads, has_ai_agent, rating, is_live)
SELECT c.id, ci.id, 'Dakar Fashion', '45', 45, true, false, 4.6, true
FROM countries c, cities ci WHERE c.code='SEN' AND ci.slug='dakar' LIMIT 1;

-- Check
SELECT 'Countries: ' || COUNT(*) FROM countries;
SELECT 'Cities: ' || COUNT(*) FROM cities;
SELECT 'Boutiques: ' || COUNT(*) FROM boutiques;
