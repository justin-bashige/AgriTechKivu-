-- ====================================================================
-- AgriTech Kivu - Schéma de base de données PostgreSQL / Supabase
-- Tables, contraintes, relations, index et politiques RLS
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'buyer', 'admin')),
  avatar_url TEXT,
  location TEXT DEFAULT 'Sud-Kivu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON public.profiles(whatsapp_number);

-- 3. TABLE PRODUCTS (Marché Agricole)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'Légumes',
    'Fruits',
    'Céréales & Féculents',
    'Légumineuses',
    'Tubercules',
    'Élevage & Volaille',
    'Semences & Plants',
    'Outils & Intrants',
    'Autre'
  )),
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
  unit TEXT NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'sac 25kg', 'sac 50kg', 'sac 100kg', 'panier', 'botte', 'pièce', 'litre', 'tonne')),
  quantity_available NUMERIC(12, 2) DEFAULT 1,
  location TEXT NOT NULL, -- Ex: Bukavu, Goma, Rutshuru, Masisi, Uvira, Walungu, Kabare
  images TEXT[] DEFAULT '{}',
  whatsapp_number TEXT NOT NULL, -- Format international normalisé (ex: 243XXXXXXXXX)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'archived', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_owner ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- 4. TABLE REPORTS (Signalements des produits pour la modération)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'Produit frauduleux',
    'Prix trompeur',
    'Produit interdit ou inapproprié',
    'Informations incorrectes',
    'Autre problème'
  )),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_product ON public.reports(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 5. TABLE CROP_DIAGNOSES (Historique des diagnostics des cultures)
CREATE TABLE IF NOT EXISTS public.crop_diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL,
  location TEXT,
  symptoms_described TEXT,
  image_url TEXT,
  probable_disease TEXT NOT NULL,
  confidence_level TEXT NOT NULL,
  confidence_score NUMERIC(5, 2),
  full_analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_user ON public.crop_diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_crop ON public.crop_diagnoses(crop_type);

-- 6. TABLE AGRICULTURAL_CONTENTS (Conseils & Calendriers)
CREATE TABLE IF NOT EXISTS public.agricultural_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agricultural_contents ENABLE ROW LEVEL SECURITY;

-- Helper function: vérifier si l'utilisateur courant est administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES PROFILES
-- Tout le monde peut lire les profils publics des vendeurs
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

-- Chaque utilisateur peut mettre à jour son propre profil
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLICIES PRODUCTS
-- Tout le monde peut lire les produits actifs
CREATE POLICY "Active products are viewable by everyone" 
  ON public.products FOR SELECT USING (status = 'active' OR public.is_admin() OR auth.uid() = owner_id);

-- Utilisateurs connectés peuvent insérer un produit
CREATE POLICY "Users can insert own products" 
  ON public.products FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Le propriétaire ou l'administrateur peut modifier
CREATE POLICY "Owner or admin can update product" 
  ON public.products FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());

-- Le propriétaire ou l'administrateur peut supprimer
CREATE POLICY "Owner or admin can delete product" 
  ON public.products FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- POLICIES REPORTS
-- Tout utilisateur authentifié peut signaler un produit
CREATE POLICY "Authenticated users can create reports" 
  ON public.reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Seul l'administrateur peut lire tous les signalements
CREATE POLICY "Only admins can view reports" 
  ON public.reports FOR SELECT USING (public.is_admin());

-- Seul l'administrateur peut mettre à jour le statut d'un signalement
CREATE POLICY "Only admins can update reports" 
  ON public.reports FOR UPDATE USING (public.is_admin());

-- POLICIES CROP DIAGNOSES
-- L'utilisateur peut consulter ses propres diagnostics
CREATE POLICY "Users can view own diagnoses" 
  ON public.crop_diagnoses FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert diagnoses" 
  ON public.crop_diagnoses FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- POLICIES AGRICULTURAL CONTENTS
-- Tout le monde peut lire le contenu pédagogique
CREATE POLICY "Public contents viewable by all" 
  ON public.agricultural_contents FOR SELECT USING (published = true OR public.is_admin());

CREATE POLICY "Admins can manage contents" 
  ON public.agricultural_contents FOR ALL USING (public.is_admin());
