export default async function handler(req: any, res: any) {
  // CORS Headers
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { code } = req.body || {};
  const adminSecret = process.env.ADMIN_BOOTSTRAP_CODE || 'agritechkivu26';

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code requis' });
  }

  if (code.trim() === adminSecret.trim()) {
    return res.status(200).json({
      valid: true,
      role: 'admin',
      token: `admin_session_${Date.now()}`,
      message: 'Rôle administrateur validé avec succès',
    });
  }

  return res.status(401).json({
    valid: false,
    error: 'Code de sécurité administrateur incorrect',
  });
}
