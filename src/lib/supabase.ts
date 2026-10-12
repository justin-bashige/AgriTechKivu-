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

  // 2. Si Supabase est configuré, essayer de charger ou compléter depuis Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
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

        // Fusionner sans doublons
        const idSet = new Set(remoteProducts.map((p) => p.id));
        for (const sp of supaProducts) {
          if (!idSet.has(sp.id)) {
            remoteProducts.push(sp);
          }
        }
        fetchedFromServer = true;
      }
    } catch (e) {
      console.warn('Supabase query failed:', e);
    }
  }

  // Si on a récupéré des données distantes (ou tableau vide officiel), mettre à jour le cache local
  if (fetchedFromServer) {
    saveLocalProducts(remoteProducts);
    return remoteProducts;
  }

  // En cas d'absence totale de réseau, repli sur le cache local du navigateur
  return getLocalProducts();
}

export async function createProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  // 1. Sauvegarder sur le serveur partagé /api/products pour que TOUS les téléphones et navigateurs le voient
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });
  } catch (err) {
    console.warn('Erreur envoi /api/products:', err);
  }

  // 2. Si Supabase est connecté, insérer également dans PostgreSQL
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
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
      }
    } catch (e) {
      console.warn('Supabase insert failed:', e);
    }
  }

  // 3. Mettre à jour le cache local
  const current = getLocalProducts();
  const updated = [newProduct, ...current.filter((p) => p.id !== newProduct.id)];
  saveLocalProducts(updated);

  return newProduct;
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
