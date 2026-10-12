import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function for /api/reports
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('reports')
          .select('*, products(title)')
          .order('created_at', { ascending: false });

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        const formatted = (data || []).map((r: any) => ({
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

        return res.status(200).json(formatted);
      }

      if (req.method === 'POST') {
        const r = req.body;
        const { data, error } = await supabase
          .from('reports')
          .insert({
            product_id: r.productId,
            reporter_id: r.reporterId || null,
            reason: r.reason,
            details: r.details || null,
            status: 'pending',
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
      }

      if (req.method === 'PUT') {
        const id = req.query.id || req.body?.id;
        const { status, adminNotes } = req.body;
        const { error } = await supabase
          .from('reports')
          .update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ success: true });
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(200).json([]);
}
