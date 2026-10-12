import React from 'react';
import { CloudSun, ScanSearch, ChevronRight, BookOpen, ShoppingBag, GraduationCap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ActiveTab } from './Navigation';
import { Product, WeatherData, UserProfile } from '../types';
import { AgriTechLogo } from './AgriTechLogo';

interface HomeViewProps {
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserProfile | null;
  weatherData: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  recentProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onOpenPublishModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectTab,
  currentUser,
  weatherData,
  weatherLoading,
  weatherError,
  recentProducts,
  onSelectProduct,
  onOpenPublishModal,
}) => {
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Mobile Bar matching mockup */}
      <div className="pt-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans">
          Accueil
        </h1>
        <p className="text-xs text-stone-500">
          {currentUser ? `Bienvenue, ${currentUser.fullName}` : 'Plateforme agricole du Kivu'}
        </p>
      </div>

      {/* Hero Welcome Card matching mockup */}
      <div className="bg-[#eef6f0] border border-[#d6ebd9] rounded-2xl p-5 relative overflow-hidden">
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <AgriTechLogo size="sm" showText={false} />
            <span><span className="text-black font-bold">AgriTech</span> Kivu</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-1 leading-snug">
            {currentUser ? `Habari yako, ${currentUser.fullName.split(' ')[0]}` : <>Bienvenue sur <span className="text-black">AgriTech</span> <span className="text-[#15803d]">Kivu</span></>}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mb-4 leading-relaxed">
            Votre outil de terrain : diagnostic des maladies des cultures par IA Gemini, prévisions météo agricoles et mise en relation directe via WhatsApp.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onSelectTab('diagnostic')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#15803d] text-white text-xs font-medium hover:bg-[#166534] transition shadow-xs"
            >
              <ScanSearch className="w-4 h-4" />
              <span>Diagnostiquer une culture</span>
            </button>
            <button
              onClick={() => onSelectTab('marketplace')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-800 text-xs font-medium hover:bg-stone-50 transition"
            >
              <span>Voir le marché</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Weather Quick Card (Directly matching mockup style) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
            Météo Agricole
          </h2>
          <button
            onClick={() => onSelectTab('weather')}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition flex items-center gap-0.5"
          >
            <span>Voir prévisions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {weatherLoading ? (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-sky-200"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-sky-200 rounded w-1/3"></div>
              <div className="h-3 bg-sky-100 rounded w-1/2"></div>
            </div>
          </div>
        ) : weatherError ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-center justify-between">
            <span>Météo temporairement inaccessible : {weatherError}</span>
            <button
              onClick={() => onSelectTab('weather')}
              className="font-semibold underline ml-2"
            >
              Réessayer
            </button>
          </div>
        ) : weatherData ? (
          <button
            onClick={() => onSelectTab('weather')}
            className="w-full text-left bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-xl p-4 shadow-sm hover:opacity-95 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
                <CloudSun className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold tracking-tight">
                    {weatherData.current.temperature}°C
                  </span>
                  <span className="text-xs text-sky-100 font-medium">
                    {weatherData.current.weatherDescription}
                  </span>
                </div>
                <div className="text-xs text-sky-100 mt-0.5">
                  {weatherData.locationName} · Pluie {weatherData.current.precipitation} mm · Humidité {weatherData.current.relativeHumidity}%
                </div>
              </div>
            </div>
            <div className="p-1 rounded-full bg-white/20 text-white">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        ) : null}
      </div>

      {/* AI Assistant Banner matching mockup */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
          Diagnostic Intelligent
        </h2>
        <div className="bg-stone-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <ScanSearch className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Diagnostiquer une culture
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-semibold border border-emerald-800">
                  <Sparkles className="w-3 h-3" />
                  Gemini
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Photographiez une feuille malade. L'IA analyse les symptômes et oriente vos soins.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('diagnostic')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shrink-0 text-center"
          >
            Lancer le diagnostic
          </button>
        </div>
      </div>

      {/* Quick Access Sections matching mockup "Conseils Agri", "Marché Kivu", "Formations" */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
            Services AgriTech
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Card 1: Conseils */}
          <button
            onClick={() => onSelectTab('advice')}
            className="group text-left bg-white border border-stone-200 rounded-xl p-3 hover:border-emerald-500 transition shadow-xs flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-stone-900 group-hover:text-emerald-700 transition">
                Conseils Agri
              </h3>
              <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                Bonnes pratiques
              </p>
            </div>
          </button>

          {/* Card 2: Marché */}
          <button
            onClick={() => onSelectTab('marketplace')}
            className="group text-left bg-white border border-stone-200 rounded-xl p-3 hover:border-emerald-500 transition shadow-xs flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-stone-900 group-hover:text-emerald-700 transition">
                Marché Kivu
              </h3>
              <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                Acheter & vendre
              </p>
            </div>
          </button>

          {/* Card 3: Formations */}
          <button
            onClick={() => onSelectTab('training')}
            className="group text-left bg-white border border-stone-200 rounded-xl p-3 hover:border-emerald-500 transition shadow-xs flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-2">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-stone-900 group-hover:text-emerald-700 transition">
                Formations
              </h3>
              <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                Vidéos pratiques
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Featured Market Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
              Marché Récent
            </h2>
            <p className="text-xs text-stone-500">
              Produits agricoles réellement publiés au Kivu
            </p>
          </div>
          <button
            onClick={() => onSelectTab('marketplace')}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition flex items-center gap-0.5"
          >
            <span>Tout voir</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentProducts.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-xl p-6 text-center">
            <ShoppingBag className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-stone-800 mb-1">
              Aucun produit disponible pour le moment.
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
              Revenez plus tard ou soyez le premier à publier vos récoltes sur le marché du Kivu.
            </p>
            <button
              onClick={onOpenPublishModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#15803d] text-white text-xs font-medium hover:bg-[#166534] transition"
            >
              <span>Publier un produit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentProducts.slice(0, 4).map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group cursor-pointer bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-emerald-600 transition shadow-xs flex flex-col"
              >
                <div className="aspect-square bg-stone-100 relative overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-stone-900/75 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    {product.category}
                  </span>
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                      {product.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {product.location}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#15803d]">
                      {product.price} {product.currency}/{product.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 flex items-center gap-3 text-stone-700 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
        <p className="leading-relaxed">
          <strong>AgriTech Kivu</strong> favorise les circuits courts. Les transactions s'effectuent directement entre producteurs et acheteurs via WhatsApp, sans intermédiaire financier non vérifié.
        </p>
      </div>
    </div>
  );
};
