import React, { useState } from 'react';
import { ShieldCheck, Trash2, MessageSquare, AlertTriangle, CheckCircle2, Clock, Filter, Search, X } from 'lucide-react';
import { Product, ProductReport, ReportStatus, UserProfile } from '../types';
import { buildAdminWhatsAppLink } from '../lib/whatsapp';

interface AdminPanelProps {
  products: Product[];
  reports: ProductReport[];
  currentUser: UserProfile;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateReportStatus: (reportId: string, status: ReportStatus, adminNotes?: string) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  reports,
  currentUser,
  onDeleteProduct,
  onUpdateReportStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'products'>('reports');
  const [selectedProductToDelete, setSelectedProductToDelete] = useState<Product | null>(null);
  const [selectedReport, setSelectedReport] = useState<ProductReport | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>('investigating');
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Status counts (calculated strictly from real data)
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const investigatingReportsCount = reports.filter((r) => r.status === 'investigating').length;

  const handleDeleteProduct = async () => {
    if (!selectedProductToDelete) return;
    setIsProcessing(true);
    try {
      await onDeleteProduct(selectedProductToDelete.id);
      setSelectedProductToDelete(null);
      setFeedback('Le produit a été définitivement retiré du marché.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la suppression.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setIsProcessing(true);
    try {
      await onUpdateReportStatus(selectedReport.id, newStatus, adminNote);
      setSelectedReport(null);
      setAdminNote('');
      setFeedback('Statut du signalement mis à jour avec succès.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la mise à jour.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-sans flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-700" />
            <span>Espace d'Administration & Modération</span>
          </h1>
          <p className="text-xs text-stone-500">
            Connecté en tant qu'administrateur : {currentUser.fullName}
          </p>
        </div>
      </div>

      {/* Real Statistics Calculated from database */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
            Produits sur le Marché
          </span>
          <p className="text-2xl font-black text-stone-900 mt-1">
            {products.length}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Signalements en attente
          </span>
          <p className="text-2xl font-black text-amber-800 mt-1">
            {pendingReportsCount}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
            Total signalements
          </span>
          <p className="text-2xl font-black text-stone-900 mt-1">
            {reports.length}
          </p>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex border-b border-stone-200 gap-4">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2.5 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
            activeTab === 'reports'
              ? 'border-amber-700 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Signalements ({reports.length})</span>
          {pendingReportsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px]">
              {pendingReportsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-2.5 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
            activeTab === 'products'
              ? 'border-amber-700 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Tous les Produits ({products.length})</span>
        </button>
      </div>

      {/* Reports View */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
              Aucun signalement enregistré pour le moment.
            </div>
          ) : (
            reports.map((report) => {
              const linkedProduct = products.find((p) => p.id === report.productId);

              const statusColors = {
                pending: 'bg-amber-100 text-amber-800 border-amber-200',
                investigating: 'bg-sky-100 text-sky-800 border-sky-200',
                resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                dismissed: 'bg-stone-100 text-stone-800 border-stone-200',
              };

              const statusLabels = {
                pending: 'En attente',
                investigating: 'En cours d\'examen',
                resolved: 'Traité',
                dismissed: 'Rejeté',
              };

              return (
                <div
                  key={report.id}
                  className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-700">
                          {report.reason}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            statusColors[report.status]
                          }`}
                        >
                          {statusLabels[report.status]}
                        </span>
                      </div>
                      <p className="text-xs text-stone-800 font-semibold mt-1">
                        Produit : {report.productTitle || linkedProduct?.title || 'Produit'}
                      </p>
                      <span className="text-[11px] text-stone-400 block">
                        Signalé le {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setNewStatus(report.status);
                        setAdminNote(report.adminNotes || '');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
                    >
                      Traiter
                    </button>
                  </div>

                  {report.details && (
                    <div className="bg-stone-50 p-2.5 rounded-xl text-xs text-stone-700">
                      <strong>Explications :</strong> {report.details}
                    </div>
                  )}

                  {report.adminNotes && (
                    <div className="bg-amber-50 p-2.5 rounded-xl text-xs text-amber-900 border border-amber-100">
                      <strong>Note administrative :</strong> {report.adminNotes}
                    </div>
                  )}

                  {/* Actions on reported product if it still exists */}
                  {linkedProduct && (
                    <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
                      <a
                        href={buildAdminWhatsAppLink(linkedProduct.whatsappNumber, linkedProduct.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Contacter le propriétaire (Admin)</span>
                      </a>

                      <button
                        onClick={() => setSelectedProductToDelete(linkedProduct)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer le produit</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Products View */}
      {activeTab === 'products' && (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
              Aucun produit sur le marché.
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">{p.title}</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {p.location} · {p.price} {p.currency}/{p.unit} · Contact : {p.whatsappNumber}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={buildAdminWhatsAppLink(p.whatsappNumber, p.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => setSelectedProductToDelete(p)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition"
                    title="Supprimer ce produit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Traiter un signalement */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Traiter le signalement
              </h3>
              <button onClick={() => setSelectedReport(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nouveau statut
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-700"
                >
                  <option value="pending">En attente</option>
                  <option value="investigating">En cours d'examen</option>
                  <option value="resolved">Traité (mesures prises)</option>
                  <option value="dismissed">Rejeté (signalement abusif)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Note d'administration / Décision
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Expliquez les vérifications effectuées..."
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="w-1/2 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-1/2 py-2 rounded-lg bg-amber-700 text-white text-xs font-bold hover:bg-amber-800"
                >
                  {isProcessing ? 'Enregistrement...' : 'Enregistrer la décision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmation suppression stricte (User Requirement) */}
      {selectedProductToDelete && (
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
                onClick={() => setSelectedProductToDelete(null)}
                className="w-1/2 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isProcessing}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                {isProcessing ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
