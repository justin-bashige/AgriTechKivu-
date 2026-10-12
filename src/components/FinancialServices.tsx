import React from 'react';
import { Landmark, Users, HelpCircle, ShieldCheck, Clock, FileText } from 'lucide-react';

export const FinancialServices: React.FC = () => {
  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans flex items-center gap-2">
          <Landmark className="w-6 h-6 text-[#15803d]" />
          <span>Services Financiers Agricoles</span>
        </h1>
        <p className="text-xs text-stone-500">
          Orientations et accompagnement pour l'accès aux financements ruraux au Kivu
        </p>
      </div>

      {/* Transparent Notice Banner (Strict User Requirement) */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-950">
          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Partenariats institutionnels en cours de structuration</span>
        </div>
        <p className="leading-relaxed">
          AgriTech Kivu n'octroie pas de crédits directement et ne perçoit aucun frais bancaire. Des protocoles de mise en relation avec des institutions de microfinance légalement agréées en RDC sont actuellement en préparation.
        </p>
      </div>

      {/* Dispositifs Existants au Kivu */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
          Mécanismes de financement accessibles au Sud-Kivu
        </h2>

        {/* Card 1: AVEC */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2.5 text-stone-900 font-bold text-sm">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <Users className="w-4 h-4" />
            </div>
            <span>Associations Villageoises d'Épargne et de Crédit (AVEC)</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Mécanisme communautaire d'épargne rotative très répandu dans les territoires de Kabare, Walungu et Uvira. Il permet de financer l'achat de semences et le paiement de la main-d'œuvre journalière sans intérêts usuraires.
          </p>
          <div className="bg-stone-50 p-2.5 rounded-xl text-[11px] text-stone-700">
            <strong>Recommandation :</strong> Rapprochez-vous des coopératives agricoles locales de votre groupement pour rejoindre ou constituer un groupe AVEC solidaire.
          </div>
        </div>

        {/* Card 2: COOPEC et IMF */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2.5 text-stone-900 font-bold text-sm">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-800">
              <Landmark className="w-4 h-4" />
            </div>
            <span>Coopératives d'Épargne et de Crédit (COOPEC / IMF agréées)</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Les institutions financières décentralisées agréées par la Banque Centrale du Congo (BCC) proposent des crédits de campagne pour les producteurs structurés en groupements enregistrés.
          </p>
        </div>

        {/* Préparer son dossier */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-[#15803d]" />
            <span>Comment préparer une demande de financement agricole ?</span>
          </div>
          <ul className="space-y-2 text-xs text-stone-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-700">1.</span>
              <span><strong>Titre d'occupation de la terre :</strong> Justificatif coutumier ou acte de concession attestant de la disponibilité de la parcelle à cultiver.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-700">2.</span>
              <span><strong>Compte d'exploitation prévisionnel :</strong> Estimation sincère des dépenses (semences, labour, transport) face aux recettes espérées au prix moyen du marché.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-700">3.</span>
              <span><strong>Caution solidaire :</strong> Adhésion à une coopérative reconnue pour garantir le remboursement mutuel.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-stone-100 rounded-xl p-3.5 text-[11px] text-stone-600 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>Toute nouvelle offre officielle de partenariat financier vérifié sera notifiée directement sur cette page.</span>
      </div>
    </div>
  );
};
