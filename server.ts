import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing JSON with generous limit for base64 plant photos
app.use(express.json({ limit: '25mb' }));

// Initialize Google Gemini SDK on the server side
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!geminiApiKey,
    timestamp: new Date().toISOString(),
  });
});

// Admin bootstrap code verification endpoint
// Never exposes the secret to the browser!
app.post('/api/admin/verify', (req, res) => {
  const { code } = req.body;
  const adminSecret = process.env.ADMIN_BOOTSTRAP_CODE || 'agritechkivu26';

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code requis' });
  }

  if (code.trim() === adminSecret.trim()) {
    return res.json({
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
});

// AI Crop Diagnosis Endpoint
app.post('/api/diagnose', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', cropType, location, symptoms, duration } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Une image de la culture est obligatoire pour le diagnostic visuel.' });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'Le service de diagnostic par IA n\'est pas configuré sur ce serveur (clé GEMINI_API_KEY absente).',
      });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const promptText = `
Tu es un expert agronome et phytopathologiste spécialisé dans l'agriculture d'Afrique centrale, en particulier la région des Grands Lacs, le Sud-Kivu et la République Démocratique du Congo (RDC).

Analyse visuellement cette photo de culture végétale.

INFORMATIONS FOURNIES PAR L'AGRICULTEUR :
- Type de culture : ${cropType || 'Non précisé'}
- Localisation / Territoire : ${location || 'Sud-Kivu / RDC'}
- Symptômes observés : ${symptoms || 'Non précisé'}
- Durée d'apparition des symptômes : ${duration || 'Non précisé'}

DIRECTIVES STRICTES DE DIAGNOSTIC AGRONOMIQUE :
1. Repère précisément les symptômes visuels visibles sur l'image (nécroses, marbrures, flétrissement, taches foliaires, chlorose, galles, moisissures, perforations d'insectes, etc.).
2. Identifie la maladie ou le ravageur le plus probable en tenant compte des cultures courantes du Sud-Kivu (ex. Cercosporiose noire ou maladie du sang sur bananier, Mosaïque ou striure brune du manioc, Flétrissement bactérien Ralstonia sur pomme de terre, Chenille légionnaire sur maïs, Mildiou ou Tuta absoluta sur tomate, Rouille ou anthracnose du haricot).
3. Indique le niveau de certitude ("Élevé", "Moyen", ou "Faible") avec un pourcentage estimé basé sur les indices visuels.
4. Explique honnêtement les limites du diagnostic visuel et ce qui ne peut pas être confirmé sans analyse de laboratoire.
5. Propose en priorité des mesures préventives et des méthodes culturales agroécologiques et non chimiques (arrachage des plants infectés, aération des parcelles, assainissement du sol, rotation des cultures, paillage, purins ou compostage).
6. Si un traitement phytosanitaire est envisageable, rappelle les règles de prudence, les homologations locales en RDC et la protection de l'agriculteur.
7. Recommande explicitement de consulter un agronome ou moniteur agricole local avant tout traitement lourd.

Réponds UNIQUEMENT sous forme de JSON strict et valide respectant scrupuleusement la structure suivante sans texte avant ni après :
{
  "cropIdentified": "Nom de la culture confirmée ou observée",
  "probableDisease": "Nom de la maladie ou du ravageur suspecté",
  "scientificName": "Nom scientifique du pathogène si connu ou pertinent",
  "confidenceLevel": "Élevé | Moyen | Faible",
  "confidenceScore": 85,
  "symptomsObserved": [
    "Symptôme précis 1",
    "Symptôme précis 2"
  ],
  "causes": [
    "Cause ou facteur favorisant 1",
    "Facteur favorisant 2"
  ],
  "uncertaintyNotes": "Explication claire du niveau d'incertitude et des informations manquantes",
  "preventiveMeasures": [
    "Mesure agroécologique / culturale 1",
    "Mesure culturale 2"
  ],
  "recommendedTreatments": [
    "Option de traitement ou bonnes pratiques sanitaires 1",
    "Option 2"
  ],
  "nextSteps": [
    "Action immédiate 1",
    "Action immédiate 2"
  ],
  "disclaimer": "Ce diagnostic visuel assisté par IA constitue une orientation préliminaire et ne remplace pas l'expertise directe d'un ingénieur agronome sur le terrain."
}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      return res.status(500).json({ error: 'Réponse vide du modèle de diagnostic.' });
    }

    try {
      const parsedData = JSON.parse(responseText);
      return res.json(parsedData);
    } catch {
      // If JSON parsing fails, extract JSON block or return structured fallback
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.json(JSON.parse(jsonMatch[0]));
      }
      return res.status(500).json({ error: 'Format de réponse invalide du modèle d\'analyse.' });
    }
  } catch (error: any) {
    console.error('Error in /api/diagnose:', error);
    return res.status(500).json({
      error: error?.message || 'Une erreur est survenue lors du diagnostic visuel.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgriTech Kivu server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
