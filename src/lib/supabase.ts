import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, ProductReport, UserProfile, ReportStatus } from '../types';

// Extraction sécurisée des variables publiques Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

export async function fetchProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase query error, falling back to local store:', error.message);
        return getLocalProducts();
      }

      // Convert DB snake_case to frontend camelCase
      return (data || []).map((p: any) => ({
        id: p.id,
        ownerId: p.owner_id,
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
    } catch (e) {
      console.warn('Supabase connection failed, using local store:', e);
      return getLocalProducts();
    }
  }

  return getLocalProducts();
}

export async function createProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          owner_id: productData.ownerId,
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
      console.warn('Supabase insert failed, saving locally:', e);
    }
  }

  // Persist locally for immediate availability and offline readiness
  const current = getLocalProducts();
  saveLocalProducts([newProduct, ...current]);
  return newProduct;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        console.warn('Supabase delete error:', error.message);
      }
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  const current = getLocalProducts();
  const filtered = current.filter((p) => p.id !== productId);
  saveLocalProducts(filtered);

  // Also clean up any reports linked to this product
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
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, products(title)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((r: any) => ({
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
      }
    } catch (e) {
      console.warn('Supabase fetch reports failed:', e);
    }
  }

  return getLocalReports();
}

export async function updateReportStatus(reportId: string, status: ReportStatus, adminNotes?: string): Promise<boolean> {
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
