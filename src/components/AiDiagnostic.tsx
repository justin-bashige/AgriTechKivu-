import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, RefreshCw, Sparkles, ChevronDown, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';
import { DiagnosisResult } from '../types';
import { KIVU_TERRITORIES } from '../services/weather';

interface AiDiagnosticProps {
  onGoToMarket: () => void;
}

const COMMON_CROPS = [
  'Bananier',
  'Manioc',
  'Maïs',
  'Haricot',
  'Tomate',
  'Pomme de terre',
  'Oignon',
  'Chou / Maraîchage',
  'Caféier',
  'Arachide',
  'Patate douce',
  'Autre culture',
];

export const AiDiagnostic: React.FC<AiDiagnosticProps> = ({ onGoToMarket }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<string>('Bananier');
  const [location, setLocation] = useState<string>('Bukavu');
  const [symptoms, setSymptoms] = useState<string>('');
  const [duration, setDuration] = useState<string>('Quelques jours');

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide (JPG, PNG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('L\'image est trop lourde. Choisissez une photo de moins de 15 Mo.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartAnalysis = async () => {
    if (!selectedImage) {
      setError('Veuillez d\'abord ajouter une photo claire de la feuille ou plante malade.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/jpeg',
          cropType,
          location,
          symptoms: symptoms.trim() || 'Non précisé',
          duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la communication avec le serveur de diagnostic.');
      }

      setResult(data as DiagnosisResult);
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      setError(
        err.message ||
        'Le service d\'analyse est momentanément indisponible. Vérifiez votre connexion Internet et réessayez.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setSymptoms('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans flex items-center gap-2">
            <span>IA Diagnostic</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Gemini
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Assistant de détection phytosanitaire pour les cultures du Kivu
          </p>
        </div>
        {result && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Nouveau test</span>
          </button>
        )}
      </div>

      {/* Main View Area */}
      {!result ? (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Photo Scanner Viewport (Matching mockup viewfinder) */}
          <div className="relative aspect-4/3 sm:aspect-16/10 bg-stone-950 flex items-center justify-center overflow-hidden">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Culture à analyser"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-6 text-stone-400">
                <Camera className="w-12 h-12 mx-auto mb-3 stroke-[1.25] text-stone-500" />
                <p className="text-sm font-medium text-stone-300">
                  Prenez une photo nette de la feuille ou plante suspecte
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Approchez-vous des taches, nécroses ou déformations pour une précision maximale.
                </p>
              </div>
            )}

            {/* Target Crosshair & Viewfinder Brackets (Visual style from mockup 1791815570701~3.jpg) */}
            <div className="absolute inset-8 pointer-events-none flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-sm"></div>
                <div className="w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-sm"></div>
              </div>
              {analyzing && (
                <div className="text-center py-2 px-4 rounded-full bg-stone-900/85 backdrop-blur-xs text-white text-xs font-semibold mx-auto flex items-center gap-2 border border-white/20 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Analyse IA en cours...</span>
                </div>
              )}
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-sm"></div>
                <div className="w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-sm"></div>
              </div>
            </div>

            {/* File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
          </div>

          {/* Photo Actions */}
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#15803d] text-white text-xs font-semibold hover:bg-[#166534] transition shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>{selectedImage ? 'Changer la photo' : 'Prendre une photo'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100 transition"
            >
              <Upload className="w-4 h-4 text-stone-500" />
              <span>Choisir dans la galerie</span>
            </button>
          </div>

          {/* Form Context Inputs */}
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Culture */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Type de culture
                </label>
                <div className="relative">
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 appearance-none"
                  >
                    {COMMON_CROPS.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Localisation */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Territoire / Ville
                </label>
                <div className="relative">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 appearance-none"
                  >
                    {KIVU_TERRITORIES.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.province})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Durée */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Depuis combien de temps observez-vous ce problème ?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['1 à 3 jours', '1 à 2 semaines', 'Plus d\'un mois'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition ${
                      duration === d
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-semibold'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Description symptômes */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Symptômes observés (facultatif)
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                placeholder="Ex. Feuilles tachées de brun avec bordures jaunissantes, flétrissement rapide..."
                className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-red-800 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={analyzing || !selectedImage}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-xs ${
                analyzing || !selectedImage
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#15803d] hover:bg-[#166534] text-white'
              }`}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyse agronomique en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Analyser la culture avec Gemini</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results View (Faithfully matching mockup 1791815570701~3.jpg) */
        <div className="space-y-4">
          {/* Top Scanned Photo Preview */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="aspect-16/9 bg-stone-900 relative">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Culture analysée"
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute bottom-2 left-2 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded font-medium">
                {result.cropIdentified} · {location}
              </div>
            </div>

            {/* Two Box Card (Maladie détectée & Niveau de certitude - Exact Mockup Style) */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-stone-100">
              {/* Box 1: Maladie */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  Maladie détectée
                </span>
                <p className="text-base font-extrabold text-stone-900 mt-1 leading-snug">
                  {result.probableDisease}
                </p>
                {result.scientificName && (
                  <span className="text-[11px] text-stone-500 italic block mt-0.5">
                    {result.scientificName}
                  </span>
                )}
              </div>

              {/* Box 2: Certitude */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  Niveau de certitude
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-base font-extrabold text-stone-900">
                    {result.confidenceLevel}
                  </p>
                  <span className="text-xs font-bold text-emerald-700">
                    ({result.confidenceScore}%)
                  </span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#15803d] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, result.confidenceScore))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Diagnostic Details */}
            <div className="p-5 space-y-4">
              {/* Mesures de prévention (Matching mockup) */}
              <div>
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
                  <span>Mesures de prévention agroécologiques</span>
                </h3>
                <ul className="space-y-1.5 bg-[#f8faf8] border border-[#e2ece4] rounded-xl p-3.5 text-xs text-stone-700">
                  {result.preventiveMeasures.map((measure, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-emerald-800 shrink-0">{idx + 1}.</span>
                      <span>{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Traitement recommandé */}
              <div>
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                  Traitement et bonnes pratiques recommandées
                </h3>
                <div className="bg-white border border-stone-200 rounded-xl p-3.5 text-xs text-stone-700 space-y-2">
                  {result.recommendedTreatments.map((treatment, idx) => (
                    <p key={idx} className="leading-relaxed">
                      · {treatment}
                    </p>
                  ))}
                </div>
              </div>

              {/* Limites & incertitudes */}
              {result.uncertaintyNotes && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600">
                  <span className="font-bold text-stone-800 block mb-0.5">Note d'incertitude :</span>
                  <p>{result.uncertaintyNotes}</p>
                </div>
              )}

              {/* Avertissement Agronome */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {result.disclaimer}
                </p>
              </div>

              {/* Action Buttons matching mockup button "Vendre mes produits" & new test */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={onGoToMarket}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Vendre mes récoltes sur le marché</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 transition"
                >
                  Tester une autre plante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
