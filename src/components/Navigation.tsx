import React from 'react';
import { Home, ScanSearch, ShoppingBag, GraduationCap, User, CloudSun, BookOpen, ShieldAlert, Bell } from 'lucide-react';
import { AgriTechLogo } from './AgriTechLogo';
import { UserProfile } from '../types';

export type ActiveTab =
  | 'home'
  | 'diagnostic'
  | 'marketplace'
  | 'training'
  | 'weather'
  | 'advice'
  | 'finance'
  | 'profile'
  | 'admin';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserProfile | null;
  unreadReportsCount?: number;
  unreadNotificationsCount?: number;
  onOpenNotifications: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  unreadReportsCount = 0,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      {/* Desktop / Tablet Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo officiel AgriTech Kivu */}
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg p-1 transition"
            >
              <AgriTechLogo size="md" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <button
                onClick={() => onSelectTab('home')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'home'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Accueil
              </button>

              <button
                onClick={() => onSelectTab('diagnostic')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'diagnostic'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <ScanSearch className="w-4 h-4 text-emerald-700" />
                <span>IA Diagnostic</span>
              </button>

              <button
                onClick={() => onSelectTab('marketplace')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'marketplace'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Marché en ligne
              </button>

              <button
                onClick={() => onSelectTab('weather')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'weather'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <CloudSun className="w-4 h-4 text-sky-600" />
                <span>Météo Agricole</span>
              </button>

              <button
                onClick={() => onSelectTab('training')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'training'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Formations
              </button>

              <button
                onClick={() => onSelectTab('advice')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'advice'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Conseils
              </button>

              <button
                onClick={() => onSelectTab('finance')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'finance'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                Finances
              </button>

              {isAdmin && (
                <button
                  onClick={() => onSelectTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium relative transition-colors ${
                    activeTab === 'admin'
                      ? 'bg-amber-100 text-amber-900 font-semibold'
                      : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Administration</span>
                  {unreadReportsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  )}
                </button>
              )}
            </nav>

            {/* Notifications Action in Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNotifications}
                className="p-2 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition relative"
                title="Notifications des nouveaux produits"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 ? (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#15803d] border-2 border-white"></span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Matches Mockup Exactly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-lg pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {/* 1. Accueil */}
          <button
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'home'
                ? 'text-[#15803d] font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Accueil</span>
          </button>

          {/* 2. IA Diagnostic */}
          <button
            onClick={() => onSelectTab('diagnostic')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'diagnostic'
                ? 'text-[#15803d] font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ScanSearch className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">IA Diagnostic</span>
          </button>

          {/* 3. Marché */}
          <button
            onClick={() => onSelectTab('marketplace')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'marketplace'
                ? 'text-[#15803d] font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Marché</span>
          </button>

          {/* 4. Formation */}
          <button
            onClick={() => onSelectTab('training')}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              activeTab === 'training'
                ? 'text-[#15803d] font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <GraduationCap className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Formation</span>
          </button>

          {/* 5. Compte / Profil */}
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              activeTab === 'profile' || activeTab === 'admin'
                ? 'text-[#15803d] font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Compte</span>
            {isAdmin && (
              <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
