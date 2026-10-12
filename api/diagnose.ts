import { GoogleGenAI } from '@google/genai';

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

  try {
    const { imageBase64, mimeType = 'image/jpeg', cropType, location, symptoms, duration } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Une image de la culture est obligatoire pour le diagnostic visuel.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'La clé GEMINI_API_KEY n\'est pas configurée dans les variables d\'environnement Vercel.',
      });
    }

    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
      return res.status(200).json(parsedData);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.status(200).json(JSON.parse(jsonMatch[0]));
      }
      return res.status(500).json({ error: 'Format de réponse invalide du modèle d\'analyse.' });
    }
  } catch (error: any) {
    console.error('Error in /api/diagnose:', error);
    return res.status(500).json({
      error: error?.message || 'Une erreur est survenue lors du diagnostic visuel.',
    });
  }
}
