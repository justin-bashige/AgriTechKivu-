import React, { useState } from 'react';
import { User, Phone, ShieldCheck, LogOut, Package, CheckCircle2, AlertCircle, Trash2, MapPin } from 'lucide-react';
import { UserProfile, Product } from '../types';
import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from '../lib/whatsapp';

interface UserProfileProps {
  currentUser: UserProfile | null;
  userProducts: Product[];
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onDeleteProduct: (id: string) => Promise<void>;
  onOpenMarketplace: () => void;
}

export const UserProfileView: React.FC<UserProfileProps> = ({
  currentUser,
  userProducts,
  onLogin,
  onLogout,
  onDeleteProduct,
  onOpenMarketplace,
}) => {
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authWhatsApp, setAuthWhatsApp] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Admin Bootstrap State
  const [adminCode, setAdminCode] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [showAdminInput, setShowAdminInput] = useState(false);

  // Handle Sign In / Sign Up
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (isSignUp) {
      if (!authFullName.trim()) {
        setAuthError('Le nom complet est requis.');
        return;
      }

      const rawWhatsApp = authWhatsApp.trim() || authPhone.trim();
      if (!rawWhatsApp || !isValidWhatsAppNumber(rawWhatsApp)) {
        setAuthError('Veuillez entrer un numéro WhatsApp valide (+243...) pour vos annonces.');
        return;
      }

      const newUser: UserProfile = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fullName: authFullName.trim(),
        phone: authPhone.trim() || authWhatsApp.trim(),
        whatsappNumber: normalizeWhatsAppNumber(rawWhatsApp),
        email: authEmail.trim() || undefined,
        role: 'farmer',
        createdAt: new Date().toISOString(),
      };

      onLogin(newUser);
      setAuthSuccess('Compte créé avec succès !');
    } else {
      // Sign In
      if (!authPhone.trim() && !authEmail.trim()) {
        setAuthError('Veuillez renseigner votre téléphone ou email.');
        return;
      }

      // Restore or initialize profile
      const normalizedPhone = normalizeWhatsAppNumber(authPhone.trim());
      const restoredUser: UserProfile = {
        id: `usr_${Date.now()}`,
        fullName: authFullName.trim() || 'Agriculteur Kivu',
        phone: authPhone.trim(),
        whatsappNumber: normalizedPhone || '243997000000',
        email: authEmail.trim() || undefined,
        role: 'farmer',
        createdAt: new Date().toISOString(),
      };

      onLogin(restoredUser);
    }
  };

  // Handle Admin Code Verification (Supports both backend API and static host fallback)
  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);

    const inputCode = adminCode.trim();
    if (!inputCode) {
      setAdminError('Veuillez saisir le code d\'administration.');
      return;
    }

    setAdminLoading(true);

    try {
      let isVerified = false;

      // 1. Try server-side endpoint first
      try {
        const response = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inputCode }),
        });

        const rawText = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          // Server returned HTML (e.g. 404 on static Vercel deployment)
        }

        if (data && data.valid) {
          isVerified = true;
        } else if (data && data.error && response.status === 401) {
          throw new Error(data.error);
        }
      } catch (networkErr: any) {
        if (networkErr.message === 'Code de sécurité administrateur incorrect') {
          throw networkErr;
        }
      }

      // 2. If endpoint not deployed on this host (e.g. static Vercel), verify known bootstrap secret
      if (!isVerified) {
        if (inputCode === 'agritechkivu26') {
          isVerified = true;
        } else {
          throw new Error('Code de sécurité administrateur incorrect.');
        }
      }

      if (isVerified && currentUser) {
        const upgraded: UserProfile = {
          ...currentUser,
          role: 'admin',
        };
        onLogin(upgraded);
        setAdminSuccess('Droits d\'administrateur validés avec succès !');
        setShowAdminInput(false);
        setAdminCode('');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Échec de la validation administrative.');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans">
          Compte & Profil
        </h1>
        <p className="text-xs text-stone-500">
          Gestion de vos coordonnées, publications et paramètres
        </p>
      </div>

      {currentUser ? (
        /* Logged In View */
        <div className="space-y-5">
          {/* Profile Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#15803d] ring-4 ring-emerald-50 flex items-center justify-center font-bold text-xl shadow-xs">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Connecté" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900 leading-tight">
                      {currentUser.fullName}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 ${
                        currentUser.role === 'admin'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {currentUser.role === 'admin' ? 'Administrateur Kivu' : 'Agriculteur / Vendeur Kivu'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-stone-600">
                    <span className="flex items-center gap-1 font-mono text-stone-700 font-medium">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      +{currentUser.whatsappNumber}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="flex items-center gap-1 text-stone-500">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      Kivu, RDC
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="flex items-center gap-1 text-stone-500">
                      <Package className="w-3.5 h-3.5 text-stone-400" />
                      {userProducts.length} {userProducts.length > 1 ? 'annonces actives' : 'annonce active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Bootstrap / Status */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm font-bold text-stone-900">
                  Rôle & Modération
                </h3>
              </div>
              {currentUser.role === 'admin' ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Rôle Administrateur Actif</span>
                </span>
              ) : (
                <button
                  onClick={() => setShowAdminInput(!showAdminInput)}
                  className="text-xs font-semibold text-amber-800 hover:underline"
                >
                  {showAdminInput ? 'Masquer' : 'Activer l\'accès administrateur'}
                </button>
              )}
            </div>

            {currentUser.role === 'admin' ? (
              <p className="text-xs text-stone-600 leading-relaxed">
                Vous avez les droits de modération sur le marché : suppression des annonces non conformes, traitement des signalements et contact officiel des vendeurs.
              </p>
            ) : showAdminInput ? (
              <form onSubmit={handleClaimAdmin} className="space-y-2 pt-2 border-t border-stone-100">
                <p className="text-xs text-stone-600">
                  Entrez le code d'accès administrateur :
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Code d'administration..."
                    className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-700"
                  />
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition shadow-xs"
                  >
                    {adminLoading ? 'Vérification...' : 'Valider'}
                  </button>
                </div>
                {adminError && <p className="text-xs text-red-600 font-medium">{adminError}</p>}
                {adminSuccess && <p className="text-xs text-emerald-600 font-medium">{adminSuccess}</p>}
              </form>
            ) : null}
          </div>

          {/* User's Published Listings */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>Mes Produits Publiés ({userProducts.length})</span>
              </h3>
            </div>

            {userProducts.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs">
                <p>Vous n'avez pas encore publié de produit sur le marché.</p>
                <button
                  onClick={onOpenMarketplace}
                  className="mt-2 text-emerald-700 font-semibold hover:underline"
                >
                  Publier une récolte maintenant
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {userProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:bg-stone-50 transition"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{prod.title}</h4>
                      <p className="text-[11px] text-stone-500">
                        {prod.price} {prod.currency}/{prod.unit} · {prod.location}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteProduct(prod.id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session & Déconnexion */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Session & Déconnexion</h3>
              <p className="text-xs text-stone-500">Fermer votre session sur cet appareil</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs transition shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      ) : (
        /* Sign In / Sign Up Form */
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex border-b border-stone-200">
            <button
              onClick={() => {
                setIsSignUp(false);
                setAuthError(null);
              }}
              className={`pb-3 text-xs font-bold flex-1 border-b-2 transition ${
                !isSignUp
                  ? 'border-[#15803d] text-[#15803d]'
                  : 'border-transparent text-stone-500'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setAuthError(null);
              }}
              className={`pb-3 text-xs font-bold flex-1 border-b-2 transition ${
                isSignUp
                  ? 'border-[#15803d] text-[#15803d]'
                  : 'border-transparent text-stone-500'
              }`}
            >
              Inscription (Agriculteur / Vendeur)
            </button>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={authFullName}
                  onChange={(e) => setAuthFullName(e.target.value)}
                  placeholder="Ex. Justin Bashige"
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Numéro de téléphone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={authWhatsApp || authPhone}
                onChange={(e) => {
                  setAuthWhatsApp(e.target.value);
                  setAuthPhone(e.target.value);
                }}
                placeholder="+243 997 123 456 ou 0997123456"
                className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
              <span className="text-[10px] text-stone-500 mt-0.5 block">
                Indispensable pour recevoir les messages d'acheteurs sur WhatsApp
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Mot de passe *
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition shadow-xs mt-2"
            >
              {isSignUp ? 'Créer mon compte' : 'Se connecter'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
