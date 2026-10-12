import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, MapPin, AlertCircle, ShoppingBag, X, MessageSquare, ShieldAlert, Trash2, CheckCircle2, Camera, Phone } from 'lucide-react';
import { Product, ProductCategory, Currency, ProductUnit, UserProfile, ReportReason } from '../types';
import { buildBuyerWhatsAppLink, buildAdminWhatsAppLink, isValidWhatsAppNumber, normalizeWhatsAppNumber } from '../lib/whatsapp';
import { KIVU_TERRITORIES } from '../services/weather';

interface MarketplaceProps {
  products: Product[];
  currentUser: UserProfile | null;
  onPublishProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSubmitReport: (productId: string, productTitle: string, reason: ReportReason, details?: string) => Promise<void>;
  onOpenAuth: () => void;
  isPublishModalOpen: boolean;
  setIsPublishModalOpen: (open: boolean) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Légumes',
  'Fruits',
  'Céréales & Féculents',
  'Légumineuses',
  'Tubercules',
  'Élevage & Volaille',
  'Semences & Plants',
  'Outils & Intrants',
  'Autre',
];

const UNITS: ProductUnit[] = [
  'kg',
  'sac 25kg',
  'sac 50kg',
  'sac 100kg',
  'panier',
  'botte',
  'pièce',
  'litre',
  'tonne',
];

export const Marketplace: React.FC<MarketplaceProps> = ({
  products,
  currentUser,
  onPublishProduct,
  onDeleteProduct,
  onSubmitReport,
  onOpenAuth,
  isPublishModalOpen,
  setIsPublishModalOpen,
  selectedProduct,
  setSelectedProduct,
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Tous');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form state for publishing
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Légumes');
  const [formPrice, setFormPrice] = useState('');
  const [formCurrency, setFormCurrency] = useState<Currency>('USD');
  const [formUnit, setFormUnit] = useState<ProductUnit>('kg');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formLocation, setFormLocation] = useState('Bukavu');
  const [formDescription, setFormDescription] = useState('');
  const [formWhatsApp, setFormWhatsApp] = useState(currentUser?.whatsappNumber || '');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formImageInput, setFormImageInput] = useState('');

  // Form state for reporting
  const [reportReason, setReportReason] = useState<ReportReason>('Produit frauduleux');
  const [reportDetails, setReportDetails] = useState('');

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'active') return false;

      const matchesSearch =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocation =
        selectedLocation === 'Tous' ||
        p.location.toLowerCase().includes(selectedLocation.toLowerCase());

      const matchesCategory =
        selectedCategory === 'Tous' || p.category === selectedCategory;

      return matchesSearch && matchesLocation && matchesCategory;
    });
  }, [products, searchQuery, selectedLocation, selectedCategory]);

  // Handle image upload from file picker
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setActionError('Veuillez sélectionner un fichier image valide.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormImages((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    if (formImageInput.trim() && formImageInput.startsWith('http')) {
      setFormImages((prev) => [...prev, formImageInput.trim()]);
      setFormImageInput('');
    }
  };

  // Submit product publication
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!formTitle.trim()) {
      setActionError('Le nom du produit est obligatoire.');
      return;
    }

    const numericPrice = parseFloat(formPrice);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setActionError('Veuillez indiquer un prix valide.');
      return;
    }

    // MANDATORY WHATSAPP VALIDATION (Strict Requirement)
    const rawNumber = formWhatsApp.trim();
    if (!rawNumber) {
      setActionError('Le numéro WhatsApp est obligatoire pour permettre aux acheteurs de vous contacter.');
      return;
    }

    if (!isValidWhatsAppNumber(rawNumber)) {
      setActionError(
        'Numéro WhatsApp invalide. Entrez un numéro complet avec indicatif (ex: +243 997 123 456 ou 0997123456).'
      );
      return;
    }

    const cleanWhatsApp = normalizeWhatsAppNumber(rawNumber);

    setActionLoading(true);
    try {
      await onPublishProduct({
        ownerId: currentUser?.id || `anon_${Date.now()}`,
        ownerName: currentUser?.fullName || 'Agriculteur Kivu',
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        price: numericPrice,
        currency: formCurrency,
        unit: formUnit,
        quantityAvailable: parseFloat(formQuantity) || 1,
        location: formLocation,
        images: formImages.length > 0 ? formImages : [],
        whatsappNumber: cleanWhatsApp,
        status: 'active',
      });

      // Reset form
      setFormTitle('');
      setFormPrice('');
      setFormDescription('');
      setFormImages([]);
      setIsPublishModalOpen(false);
      setActionSuccess('Votre produit a été publié avec succès sur le marché !');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de la publication du produit.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit product report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await onSubmitReport(
        selectedProduct.id,
        selectedProduct.title,
        reportReason,
        reportDetails.trim()
      );
      setIsReportModalOpen(false);
      setReportDetails('');
      setActionSuccess('Signalement envoyé à l\'administrateur pour examen.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de l\'envoi du signalement.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm delete product
  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await onDeleteProduct(selectedProduct.id);
      setIsDeleteConfirmOpen(false);
      setSelectedProduct(null);
      setActionSuccess('Produit supprimé avec succès.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Erreur lors de la suppression.');
    } finally {
      setActionLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = selectedProduct && currentUser && selectedProduct.ownerId === currentUser.id;

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Top Header matching mockup 1791815570701~4.jpg */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans">
            Marché en ligne
          </h1>
          <p className="text-xs text-stone-500">
            Produits vivriers et maraîchers en direct des producteurs du Kivu
          </p>
        </div>
      </div>

      {/* Notifications toast */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search Bar matching mockup */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher tomates, pommes de terre, maïs, haricot..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Territoires Filter Buttons (Matching Mockup horizontal pills with location icons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedLocation('Tous')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
            selectedLocation === 'Tous'
              ? 'bg-[#15803d] text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          Tous les lieux
        </button>

        {['Bukavu', 'Goma', 'Masisi', 'Rutshuru', 'Uvira', 'Walungu', 'Kabare', 'Kalehe'].map((loc) => (
          <button
            key={loc}
            onClick={() => setSelectedLocation(loc)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              selectedLocation === loc
                ? 'bg-[#15803d] text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <MapPin className="w-3 h-3 opacity-70" />
            <span>{loc}</span>
          </button>
        ))}
      </div>

      {/* Categories Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs border-b border-stone-100">
        <button
          onClick={() => setSelectedCategory('Tous')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition ${
            selectedCategory === 'Tous'
              ? 'bg-stone-800 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Toutes catégories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition ${
              selectedCategory === cat
                ? 'bg-stone-800 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Products (2 columns on mobile matching mockup 1791815570701~4.jpg) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center my-6">
          <ShoppingBag className="w-10 h-10 text-stone-400 mx-auto mb-3 stroke-[1.25]" />
          <h3 className="text-sm sm:text-base font-bold text-stone-800 mb-1">
            Aucun produit disponible pour le moment.
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mb-5 leading-relaxed">
            Revenez plus tard ou soyez le premier à publier vos récoltes et produits agricoles sur le marché du Sud-Kivu.
          </p>
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-semibold hover:bg-[#166534] transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Publier un produit</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="group cursor-pointer bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-emerald-600 transition shadow-xs flex flex-col"
            >
              {/* Product Photo */}
              <div className="aspect-square bg-stone-100 relative overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <ShoppingBag className="w-10 h-10 stroke-[1.25]" />
                  </div>
                )}
                {/* Category tag */}
                <div className="absolute top-2 left-2 bg-stone-900/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-medium">
                  {product.category}
                </div>
              </div>

              {/* Product Details (Exact Mockup Layout: Title, Price$/unit, Location) */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-1">
                    {product.title}
                  </h3>
                  <div className="text-xs sm:text-sm font-extrabold text-[#15803d] mt-1">
                    {product.price} {product.currency}/{product.unit}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>{product.location}</span>
                  </span>
                  <span className="text-emerald-700 font-medium">WhatsApp</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button "Vendre mes produits" (Matching Mockup 1791815570701~4.jpg) */}
      <div className="fixed bottom-20 md:bottom-8 right-4 sm:right-8 z-30">
        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#15803d] hover:bg-[#166534] text-white font-semibold text-xs sm:text-sm shadow-xl transition active:scale-95"
          style={{ boxShadow: '0 4px 14px rgba(21, 128, 61, 0.4)' }}
        >
          <Camera className="w-4 h-4" />
          <span>Vendre mes produits</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODAL / BOTTOM SHEET : DÉTAILS D'UN PRODUIT                    */}
      {/* ============================================================== */}
      {selectedProduct && !isReportModalOpen && !isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
            {/* Header / Close */}
            <div className="relative">
              <div className="aspect-16/10 bg-stone-100 relative overflow-hidden">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <ShoppingBag className="w-12 h-12 stroke-[1.25]" />
                  </div>
                )}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md font-medium">
                  {selectedProduct.category}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-stone-900">
                    {selectedProduct.title}
                  </h2>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-[#15803d]">
                      {selectedProduct.price} {selectedProduct.currency}
                    </span>
                    <span className="text-xs text-stone-500 block">
                      par {selectedProduct.unit}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{selectedProduct.location}</span>
                  </span>
                  <span>·</span>
                  <span>Disponibilité : {selectedProduct.quantityAvailable} {selectedProduct.unit}(s)</span>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-700 leading-relaxed">
                  <span className="font-semibold text-stone-900 block mb-1">Description :</span>
                  <p>{selectedProduct.description}</p>
                </div>
              )}

              {/* WhatsApp Contact Action (Strict Format Compliance) */}
              <div className="space-y-2 pt-2">
                <a
                  href={buildBuyerWhatsAppLink(selectedProduct.whatsappNumber, selectedProduct.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contacter le vendeur via WhatsApp</span>
                </a>
                <p className="text-[11px] text-stone-500 text-center">
                  Ouvre WhatsApp avec un message pré-rempli pour échanger directement avec le propriétaire.
                </p>
              </div>

              {/* Actions supplémentaires (Signaler, Admin, Supprimer) */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs text-stone-500 hover:text-red-700 flex items-center gap-1 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Signaler cette annonce</span>
                </button>

                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer le produit</span>
                  </button>
                )}
              </div>

              {/* Admin specific action */}
              {isAdmin && !isOwner && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
                  <span>Modérateur : Contact administratif</span>
                  <a
                    href={buildAdminWhatsAppLink(selectedProduct.whatsappNumber, selectedProduct.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-amber-700 text-white font-semibold text-[11px] hover:bg-amber-800 transition"
                  >
                    WhatsApp Admin
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL : PUBLIER UN PRODUIT                                      */}
      {/* ============================================================== */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Publier un produit agricole
              </h2>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="p-5 space-y-4">
              {actionError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Nom du produit */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex. Tomates fraîches de Rutshuru, Maïs blanc grain, Pommes de terre Masisi..."
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Catégorie & Localisation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Territoire / Localisation *
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {KIVU_TERRITORIES.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.province})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prix, Devise & Unité */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Prix *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="2.5"
                    className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Devise
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as Currency)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
                  >
                    <option value="USD">$ USD</option>
                    <option value="CDF">FC CDF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Unité
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as ProductUnit)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        par {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantité disponible */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Quantité disponible
                </label>
                <input
                  type="number"
                  min="1"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  placeholder="Ex. 50"
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* NUMÉRO WHATSAPP OBLIGATOIRE (Condition sine qua non) */}
              <div className="bg-[#eef8f1] border border-[#cbe6d2] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Numéro WhatsApp de contact (Obligatoire) *</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Ce numéro permettra aux acheteurs de vous écrire directement sur WhatsApp.
                </p>
                <input
                  type="tel"
                  required
                  value={formWhatsApp}
                  onChange={(e) => setFormWhatsApp(e.target.value)}
                  placeholder="+243 997 123 456 ou 0997123456"
                  className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
              </div>

              {/* Photos du produit */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Photos du produit
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition">
                    <Camera className="w-4 h-4 text-stone-600" />
                    <span>Choisir une photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Image Previews */}
                {formImages.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                    {formImages.map((img, i) => (
                      <div key={i} className="w-16 h-16 rounded-lg relative overflow-hidden shrink-0 border border-stone-200">
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormImages(formImages.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 bg-stone-900/80 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Description / Précisions sur la récolte
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex. Récolte bio du matin, sans pesticides chimiques, disponible au marché central ou livraison possible..."
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-2/3 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? 'Enregistrement...' : 'Confirmer la publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL : SIGNALEMENT D'UN PRODUIT                                */}
      {/* ============================================================== */}
      {isReportModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Signaler ce produit</span>
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Produit concerné : <strong>{selectedProduct.title}</strong>
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Motif du signalement
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Produit frauduleux">Produit frauduleux</option>
                  <option value="Prix trompeur">Prix trompeur</option>
                  <option value="Produit interdit ou inapproprié">Produit interdit ou inapproprié</option>
                  <option value="Informations incorrectes">Informations incorrectes</option>
                  <option value="Autre problème">Autre problème</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Explications complémentaires
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Précisez pourquoi cette annonce pose problème..."
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="w-1/2 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  {actionLoading ? 'Envoi...' : 'Envoyer le signalement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL : CONFIRMATION DE SUPPRESSION (Requis strict)            */}
      {/* ============================================================== */}
      {isDeleteConfirmOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-stone-900">
                Supprimer le produit ?
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                « Voulez-vous vraiment supprimer ce produit ? Cette action ne peut pas être annulée facilement. »
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs"
              >
                {actionLoading ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
