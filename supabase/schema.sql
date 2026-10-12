-- ====================================================================
-- AgriTech Kivu - Script SQL pour Supabase SQL Editor
-- Copiez et collez ce script dans l'éditeur SQL de votre projet Supabase
-- (https://supabase.com/dashboard/project/fhvrmrvcypnxmrcptvod/sql)
-- ====================================================================

-- 1. TABLE DES PRODUITS (Marché Agricole)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Légumes',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  unit TEXT NOT NULL DEFAULT 'kg',
  quantity_available NUMERIC(12, 2) DEFAULT 1,
  location TEXT NOT NULL DEFAULT 'Bukavu',
  images TEXT[] DEFAULT '{}',
  whatsapp_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Sécurité Row Level Security (RLS) pour les produits
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select products" ON public.products;
CREATE POLICY "Allow public select products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update products" ON public.products;
CREATE POLICY "Allow public update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete products" ON public.products;
CREATE POLICY "Allow public delete products" ON public.products FOR DELETE USING (true);


-- 2. TABLE DES SIGNALEMENTS (Modération Marché)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT,
  reporter_id TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_product ON public.reports(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select reports" ON public.reports;
CREATE POLICY "Allow public select reports" ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert reports" ON public.reports;
CREATE POLICY "Allow public insert reports" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update reports" ON public.reports;
CREATE POLICY "Allow public update reports" ON public.reports FOR UPDATE USING (true);


-- 3. TABLE DES PROFILS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'farmer',
  avatar_url TEXT,
  location TEXT DEFAULT 'Sud-Kivu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select profiles" ON public.profiles;
CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);
