import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, ProductReport, UserProfile, ReportStatus } from '../types';

// Extraction sécurisée des variables publiques Supabase (env vars ou stockage local)
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const localCustomUrl = typeof window !== 'undefined' ? localStorage.getItem('agritech_custom_supabase_url') : null;
const localCustomKey = typeof window !== 'undefined' ? localStorage.getItem('agritech_custom_supabase_anon_key') : null;

export const supabaseUrl = envSupabaseUrl || localCustomUrl || '';
export const supabaseAnonKey = envSupabaseAnonKey || localCustomKey || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const SUPABASE_SCHEMA_SQL = `-- AgriTech Kivu - Script SQL pour Supabase SQL Editor
-- Copiez et collez ce script dans l'éditeur SQL de votre projet Supabase :
-- https://supabase.com/dashboard/project/fhvrmrvcypnxmrcptvod/sql/new

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

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

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
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
`;

export async function checkSupabaseDatabaseStatus(): Promise<{
  configured: boolean;
  tablesExist: boolean;
  errorMessage?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { configured: false, tablesExist: false };
  }
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      return { configured: true, tablesExist: false, errorMessage: error.message };
    }
    return { configured: true, tablesExist: true };
  } catch (err: any) {
    return { configured: true, tablesExist: false, errorMessage: err?.message };
  }
}

export function setCustomSupabaseCredentials(url: string, anonKey: string): void {
  try {
    localStorage.setItem('agritech_custom_supabase_url', url.trim());
    localStorage.setItem('agritech_custom_supabase_anon_key', anonKey.trim());
    window.location.reload();
  } catch (e) {
    console.error(e);
  }
}

// Clés de persistance locale lorsque Supabase n'est pas encore lié
const LOCAL_STORAGE_PRODUCTS_KEY = 'agritech_kivu_products_db';
const LOCAL_STORAGE_REPORTS_KEY = 'agritech_kivu_reports_db';
const LOCAL_STORAGE_CURRENT_USER_KEY = 'agritech_kivu_active_user';
const LOCAL_STORAGE_SAVED_USERS_KEY = 'agritech_kivu_users_db';

// Initialisation sécurisée sans données fictives
function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('agritech:products-updated'));
  } catch (e) {
    console.error('Failed to save products locally', e);
  }
}

function getLocalReports(): ProductReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: ProductReport[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
    window.dispatchEvent(new Event('agritech:reports-updated'));
  } catch (e) {
    console.error('Failed to save reports locally', e);
  }
}

// ==========================================
// OPÉRATIONS SUR LES PRODUITS
// ==========================================

// ==========================================
// OPÉRATIONS SUR LES PRODUITS (Sync Centralisée Cloud & Serveur)
// ==========================================

// Helper de déduplication intelligente (anti-doublons de produits)
export function deduplicateProducts(products: Product[]): Product[] {
  const result: Product[] = [];
  const seenIds = new Set<string>();
  const seenSignatures = new Map<string, Product>();

  for (const p of products) {
    if (!p || !p.title) continue;
    if (seenIds.has(p.id)) continue;

    const normPhone = (p.whatsappNumber || '').replace(/\D/g, '');
    const normTitle = (p.title || '').trim().toLowerCase();
    const sig = `${normPhone}_${normTitle}_${p.price}_${p.unit || ''}`;

    const existing = seenSignatures.get(sig);
    if (existing) {
      // Si nous avons les deux, préférer le produit officiel Supabase (non temporaire prod_)
      const existingIsTemp = existing.id.startsWith('prod_');
      const currentIsTemp = p.id.startsWith('prod_');
      if (existingIsTemp && !currentIsTemp) {
        const idx = result.findIndex((item) => item.id === existing.id);
        if (idx !== -1) {
          result[idx] = p;
          seenIds.delete(existing.id);
          seenIds.add(p.id);
          seenSignatures.set(sig, p);
        }
      }
      continue;
    }

    seenIds.add(p.id);
    seenSignatures.set(sig, p);
    result.push(p);
  }

  return result;
}

// Mémoire tampon anti-soumission rapide (évite les doublons lors des doubles-clics sur mobile)
const recentSubmissions = new Map<string, { product: Product; timestamp: number }>();

let lastSupabaseError: string | null = null;

export function getLastSupabaseError(): string | null {
  return lastSupabaseError;
}

export async function fetchProducts(): Promise<Product[]> {
  let remoteProducts: Product[] = [];
  let fetchedFromServer = false;

  // 1. Essayer de charger depuis le serveur partagé /api/products
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        remoteProducts = data;
        fetchedFromServer = true;
      }
    }
  } catch (err) {
    console.warn('API /api/products non accessible:', err);
  }

  // 2. Si Supabase est configuré, essayer de charger depuis Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        lastSupabaseError = null;
        const supaProducts: Product[] = data.map((p: any) => ({
          id: p.id,
          ownerId: p.owner_id || '',
          title: p.title,
          description: p.description || '',
          category: p.category,
          price: Number(p.price),
          currency: p.currency,
          unit: p.unit,
          quantityAvailable: Number(p.quantity_available || 1),
          location: p.location,
          images: p.images || [],
          whatsappNumber: p.whatsapp_number,
          status: p.status,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));

        // Fusionner et dédupliquer intelligemment
        remoteProducts = deduplicateProducts([...supaProducts, ...remoteProducts]);
        fetchedFromServer = true;
      } else if (error) {
        lastSupabaseError = error.message;
        console.warn('Supabase fetch products error:', error);
      }
    } catch (e: any) {
      lastSupabaseError = e?.message || 'Erreur réseau Supabase';
      console.warn('Supabase query failed:', e);
    }
  }

  // Si on a récupéré des données distantes, appliquer la déduplication et mettre à jour le cache local
  if (fetchedFromServer) {
    const cleanList = deduplicateProducts(remoteProducts);
    saveLocalProducts(cleanList);
    return cleanList;
  }

  // En cas d'absence totale de réseau, repli sur le cache local dédupliqué
  return deduplicateProducts(getLocalProducts());
}

export async function createProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const normPhone = (productData.whatsappNumber || '').replace(/\D/g, '');
  const normTitle = (productData.title || '').trim().toLowerCase();
  const subSig = `${normPhone}_${normTitle}_${productData.price}_${productData.unit || ''}`;

  // Vérification anti-double-clic / anti-doublon (15 secondes)
  const existingRecent = recentSubmissions.get(subSig);
  const now = Date.now();
  if (existingRecent && now - existingRecent.timestamp < 15000) {
    return existingRecent.product;
  }

  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  // 1. Si Supabase est connecté, insérer en premier dans PostgreSQL pour obtenir l'ID officiel
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          owner_id: productData.ownerId || null,
          title: productData.title,
          description: productData.description,
          category: productData.category,
          price: productData.price,
          currency: productData.currency,
          unit: productData.unit,
          quantity_available: productData.quantityAvailable,
          location: productData.location,
          images: productData.images,
          whatsapp_number: productData.whatsappNumber,
          status: productData.status || 'active',
        })
        .select()
        .single();

      if (!error && data) {
        newProduct.id = data.id;
        newProduct.createdAt = data.created_at;
        lastSupabaseError = null;
      } else if (error) {
        lastSupabaseError = error.message;
        console.warn('Supabase insert failed:', error);
      }
    } catch (e: any) {
      lastSupabaseError = e?.message || 'Erreur réseau Supabase';
      console.warn('Supabase insert failed:', e);
    }
  }

  // 2. Sauvegarder sur le serveur partagé /api/products avec le MÊME id unifié
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });
  } catch (err) {
    console.warn('Erreur envoi /api/products:', err);
  }

  // Mémoriser dans l'anti-flood
  recentSubmissions.set(subSig, { product: newProduct, timestamp: now });

  // 3. Mettre à jour le cache local sans doublons
  const current = getLocalProducts();
  const updated = deduplicateProducts([newProduct, ...current.filter((p) => p.id !== newProduct.id)]);
  saveLocalProducts(updated);

  return newProduct;
}

// Fonction de nettoyage des doublons existants
export async function cleanDuplicateProducts(): Promise<number> {
  let cleanedCount = 0;
  try {
    // 1. Nettoyer Supabase si connecté
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('products')
        .select('id, title, whatsapp_number, price, unit, created_at')
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        const seen = new Set<string>();
        const toDelete: string[] = [];

        for (const row of data) {
          const normPhone = (row.whatsapp_number || '').replace(/\D/g, '');
          const normTitle = (row.title || '').trim().toLowerCase();
          const sig = `${normPhone}_${normTitle}_${row.price}_${row.unit || ''}`;
          if (seen.has(sig)) {
            toDelete.push(row.id);
          } else {
            seen.add(sig);
          }
        }

        for (const delId of toDelete) {
          await supabase.from('products').delete().eq('id', delId);
          await fetch(`/api/products/${delId}`, { method: 'DELETE' }).catch(() => {});
          cleanedCount++;
        }
      }
    }

    // 2. Nettoyer le cache local
    const local = getLocalProducts();
    const dedupedLocal = deduplicateProducts(local);
    if (dedupedLocal.length < local.length) {
      cleanedCount += local.length - dedupedLocal.length;
      saveLocalProducts(dedupedLocal);
    }
  } catch (err) {
    console.warn('Erreur cleanDuplicateProducts:', err);
  }
  return cleanedCount;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  // 1. Supprimer sur le serveur partagé
  try {
    await fetch(`/api/products/${productId}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('API delete error:', e);
  }

  // 2. Supprimer sur Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  // 3. Supprimer du cache local
  const current = getLocalProducts();
  const filtered = current.filter((p) => p.id !== productId);
  saveLocalProducts(filtered);

  // Nettoyer les signalements associés
  const reports = getLocalReports();
  saveLocalReports(reports.filter((r) => r.productId !== productId));

  return true;
}

// ==========================================
// OPÉRATIONS SUR LES SIGNALEMENTS (REPORTS)
// ==========================================

export async function createReport(reportData: Omit<ProductReport, 'id' | 'createdAt' | 'status'>): Promise<ProductReport> {
  const newReport: ProductReport = {
    ...reportData,
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // 1. Sauvegarder sur le serveur partagé
  try {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReport),
    });
  } catch (err) {
    console.warn('API report post failed:', err);
  }

  // 2. Si Supabase est connecté
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('reports').insert({
        product_id: reportData.productId,
        reporter_id: reportData.reporterId || null,
        reason: reportData.reason,
        details: reportData.details || null,
        status: 'pending',
      });
    } catch (e) {
      console.warn('Supabase report insert failed:', e);
    }
  }

  const current = getLocalReports();
  saveLocalReports([newReport, ...current]);
  return newReport;
}

export async function fetchReports(): Promise<ProductReport[]> {
  // 1. Essayer de charger depuis le serveur
  try {
    const res = await fetch('/api/reports');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveLocalReports(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('API reports fetch failed:', err);
  }

  // 2. Si Supabase est connecté
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, products(title)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const supaReports = data.map((r: any) => ({
          id: r.id,
          productId: r.product_id,
          productTitle: r.products?.title || 'Produit',
          reporterId: r.reporter_id,
          reason: r.reason,
          details: r.details,
          status: r.status,
          adminNotes: r.admin_notes,
          createdAt: r.created_at,
        }));
        saveLocalReports(supaReports);
        return supaReports;
      }
    } catch (e) {
      console.warn('Supabase fetch reports failed:', e);
    }
  }

  return getLocalReports();
}

export async function updateReportStatus(reportId: string, status: ReportStatus, adminNotes?: string): Promise<boolean> {
  // 1. Mettre à jour sur le serveur
  try {
    await fetch(`/api/reports/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes }),
    });
  } catch (err) {
    console.warn('API update report failed:', err);
  }

  // 2. Si Supabase est connecté
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('reports')
        .update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', reportId);
    } catch (e) {
      console.warn('Supabase update report failed:', e);
    }
  }

  const reports = getLocalReports();
  const updated = reports.map((r) =>
    r.id === reportId ? { ...r, status, adminNotes: adminNotes ?? r.adminNotes } : r
  );
  saveLocalReports(updated);
  return true;
}

// ==========================================
// GESTION DU PROFIL UTILISATEUR & SESSION
// ==========================================

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
      // Save or update in registry of users
      const rawUsers = localStorage.getItem(LOCAL_STORAGE_SAVED_USERS_KEY);
      const users: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [];
      const existingIdx = users.findIndex((u) => u.id === user.id || (u.phone && u.phone === user.phone));
      if (existingIdx >= 0) {
        users[existingIdx] = user;
      } else {
        users.push(user);
      }
      localStorage.setItem(LOCAL_STORAGE_SAVED_USERS_KEY, JSON.stringify(users));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    }
    window.dispatchEvent(new Event('agritech:auth-changed'));
  } catch (e) {
    console.error('Error saving user session', e);
  }
}

export function getAllRegisteredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
