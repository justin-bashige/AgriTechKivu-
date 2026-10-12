import React, { useState } from 'react';
import { Bell, ShoppingBag, X, ChevronRight, Check, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { Product } from '../types';

interface NotificationsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onGoToMarket: () => void;
}

export const NotificationsPopup: React.FC<NotificationsPopupProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onGoToMarket,
}) => {
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('agritech_read_notifications');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  if (!isOpen) return null;

  // Active products sorted by creation date (newest first)
  const recentProducts = [...products]
    .filter((p) => p.status === 'active')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const markAllAsRead = () => {
    const allIds = recentProducts.map((p) => p.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('agritech_read_notifications', JSON.stringify(allIds));
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductClick = (product: Product) => {
    if (!readIds.includes(product.id)) {
      const updated = [...readIds, product.id];
      setReadIds(updated);
      try {
        localStorage.setItem('agritech_read_notifications', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    onSelectProduct(product);
    onClose();
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return `Il y a ${diffDays} j`;
  };

  const unreadCount = recentProducts.filter((p) => !readIds.includes(p.id)).length;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-start sm:items-start justify-center sm:justify-end sm:pr-8 sm:pt-16 p-3 animate-in fade-in duration-150">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Pop-up Container */}
      <div className="relative w-full sm:max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#15803d] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">
                  Notifications du Marché
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#15803d] text-white text-[10px] font-bold">
                    {unreadCount} nouv.
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                Arrivages et nouvelles récoltes disponibles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition"
                title="Tout marquer comme lu"
              >
                Tout lire
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-1">
          {recentProducts.length === 0 ? (
            <div className="py-10 px-6 text-center text-xs text-stone-500 space-y-2">
              <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto stroke-[1.25]" />
              <p className="font-semibold text-stone-700">
                Aucune notification pour le moment.
              </p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                Dès que des agriculteurs publieront de nouveaux produits ou récoltes sur le marché, vous recevrez une alerte ici.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onGoToMarket();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15803d] text-white text-xs font-medium hover:bg-[#166534] transition"
                >
                  <span>Explorer le marché</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            recentProducts.map((product) => {
              const isUnread = !readIds.includes(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`p-3 rounded-xl cursor-pointer transition flex items-start gap-3 hover:bg-emerald-50/50 ${
                    isUnread ? 'bg-emerald-50/30' : 'bg-white'
                  }`}
                >
                  {/* Thumbnail / Icon */}
                  <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden relative shrink-0 border border-stone-200">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                      </div>
                    )}
                    {isUnread && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#15803d]"></span>
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Nouveau sur le marché
                      </span>
                      <span className="text-[10px] text-stone-400 shrink-0">
                        {getTimeAgo(product.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">
                      {product.title}
                    </h4>

                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-extrabold text-[#15803d]">
                        {product.price} {product.currency}/{product.unit}
                      </span>
                      <span className="text-stone-500 flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{product.location}</span>
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-stone-300 self-center shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {recentProducts.length > 0 && (
          <div className="p-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <span className="text-[11px] text-stone-500">
              {recentProducts.length} produit(s) en vente
            </span>
            <button
              onClick={() => {
                onClose();
                onGoToMarket();
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1"
            >
              <span>Voir tout le marché</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
