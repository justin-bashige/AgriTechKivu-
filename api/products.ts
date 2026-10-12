import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function for /api/products
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
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        const formatted = (data || []).map((p: any) => ({
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

        return res.status(200).json(formatted);
      }

      if (req.method === 'POST') {
        const p = req.body;
        const { data, error } = await supabase
          .from('products')
          .insert({
            title: p.title,
            description: p.description || '',
            category: p.category,
            price: p.price,
            currency: p.currency,
            unit: p.unit,
            quantity_available: p.quantityAvailable,
            location: p.location,
            images: p.images || [],
            whatsapp_number: p.whatsappNumber,
            status: p.status || 'active',
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
      }

      if (req.method === 'DELETE') {
        const id = req.query.id || req.body?.id;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ success: true });
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Fallback if Supabase not yet set on Vercel
  return res.status(200).json([]);
}
