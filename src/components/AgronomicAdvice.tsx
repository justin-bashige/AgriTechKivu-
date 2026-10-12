import React, { useState } from 'react';
import { BookOpen, Calendar, Sprout, ShieldAlert, Layers, Search, ChevronRight } from 'lucide-react';

interface AdviceArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  keyPoints: string[];
  relevance: string;
}

const ADVICE_ARTICLES: AdviceArticle[] = [
  {
    id: 'kivu-seasons',
    category: 'Calendrier agricole',
    title: 'Calendrier des saisons A et B au Sud-Kivu',
    summary: 'Optimisation des dates de semis en fonction des régimes pluviométriques bimodal du Kivu.',
    keyPoints: [
      'Saison A (Septembre à Janvier) : Semis principal pour le maïs, le haricot et la pomme de terre dès les premières pluies régulières.',
      'Saison B (Février à Juin) : Deuxième cycle cultural privilégiant le maraîchage, le manioc et le haricot de contre-saison.',
      'Saison C (Juillet à Août / Marais) : Exploitation prudente des bas-fonds et marais pour le maraîchage irrigué durant la saison sèche.',
    ],
    relevance: 'Valable pour Kabare, Walungu, Kalehe et Uvira',
  },
  {
    id: 'erosion-hills',
    category: 'Conservation des sols',
    title: 'Lutte anti-érosive sur les fortes pentes du Kivu',
    summary: 'Techniques de fixation des sols pour éviter les glissements de terrain et la perte de fertilité arable.',
    keyPoints: [
      'Tracer des courbes de niveau à l\'aide d\'un niveau à pente en A.',
      'Planter des haies vives de graminées fixatrices (Vetiver, Tripsacum) sur les talus.',
      'Pratiquer le paillage résiduel systématique pour briser l\'impact direct des gouttes d\'eau orageuses.',
      'Créer des fossés d\'infiltration borgnes pour recharger la nappe sans ravinement.',
    ],
    relevance: 'Indispensable sur collines et versants escarpés',
  },
  {
    id: 'bxw-prevention',
    category: 'Santé végétale',
    title: 'Prévention du flétrissement bactérien du bananier (BXW)',
    summary: 'Mesures de biosécurité indispensables pour protéger les bananeraies contre Xanthomonas.',
    keyPoints: [
      'Désinfecter systématiquement les outils de coupe (machettes, couteaux) à la flamme ou à l\'eau de javel entre deux bananiers.',
      'Couper immédiatement le bourgeon mâle à l\'aide d\'une perche fourchue (sans outil tranchant) dès l\'ouverture de la dernière main.',
      'Arracher et enfouir sur place les touffes atteintes (feuilles jaunies, écoulement bactérien jaunâtre).',
      'Ne jamais transporter de rejets ou de drageons issus d\'une parcelle contaminée.',
    ],
    relevance: 'Urgence phytosanitaire au Kivu',
  },
  {
    id: 'compost-aerobie',
    category: 'Fertilisation organique',
    title: 'Fabrication de compost chaud en tas',
    summary: 'Régénération de la matière organique sans dépendance aux engrais chimiques onéreux.',
    keyPoints: [
      'Alterner 1 couche de matière verte riche en azote (déchets de cuisine, herbes fraîches) et 1 couche de matière brune riche en carbone (paille sèche, tiges de maïs hachées).',
      'Ajouter une fine couche de fumier animal ou de terreau forestier pour inoculer les micro-organismes.',
      'Arroser modérément sans saturer et aérer en retournant le tas tous les 15 jours.',
      'Le compost est mûr au bout de 2 à 3 mois (odeur de sous-bois, couleur sombre et friable).',
    ],
    relevance: 'Applicable à toutes les exploitations familiales',
  },
  {
    id: 'post-harvest-storage',
    category: 'Conservation post-récolte',
    title: 'Stockage étanche du maïs et des haricots',
    summary: 'Protection contre les charançons et les mycotoxines après la récolte.',
    keyPoints: [
      'Séchage complet au soleil jusqu\'à ce que le grain craque sous la dent (taux d\'humidité < 13%).',
      'Utiliser des sacs hermétiques triple couche (type PICS) sans aucun produit chimique.',
      'Stocker les sacs sur des palettes en bois à 15 cm du sol et à l\'écart des murs.',
      'Inspecter régulièrement l\'absence de condensation dans les récipients hermétiques.',
    ],
    relevance: 'Maintien de la valeur marchande pour la vente',
  },
];

export const AgronomicAdvice: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<AdviceArticle | null>(null);

  const filtered = ADVICE_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#15803d]" />
          <span>Conseils & Bonnes Pratiques Agricoles</span>
        </h1>
        <p className="text-xs text-stone-500">
          Fiches techniques adaptées aux réalités pédoclimatiques du Sud-Kivu
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par culture, maladie, compost ou saison..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedArticle(item)}
            className="cursor-pointer bg-white border border-stone-200 rounded-2xl p-4 hover:border-emerald-600 transition shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {item.category}
              </span>
              <span className="text-[11px] text-stone-400">
                {item.relevance}
              </span>
            </div>

            <h3 className="text-sm font-bold text-stone-900">
              {item.title}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {item.summary}
            </p>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>Lire la fiche pratique</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  {selectedArticle.category}
                </span>
                <h2 className="text-base font-bold text-stone-900 mt-0.5">
                  {selectedArticle.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl">
              {selectedArticle.summary}
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Recommandations techniques essentielles :
              </h4>
              <ul className="space-y-2 text-xs text-stone-700">
                {selectedArticle.keyPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 bg-[#f8faf8] p-2.5 rounded-lg border border-emerald-100">
                    <span className="font-bold text-emerald-800 shrink-0">{i + 1}.</span>
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-full py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-bold hover:bg-[#166534] transition"
              >
                Fermer la fiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
