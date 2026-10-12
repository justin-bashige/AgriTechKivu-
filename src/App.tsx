import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Navigation } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { AiDiagnostic } from './components/AiDiagnostic';
import { Marketplace } from './components/Marketplace';
import { TrainingView } from './components/TrainingView';
import { WeatherView } from './components/WeatherView';
import { AgronomicAdvice } from './components/AgronomicAdvice';
import { FinancialServices } from './components/FinancialServices';
import { AdminPanel } from './components/AdminPanel';
import { UserProfileView } from './components/UserProfile';
import { NotificationsPopup } from './components/NotificationsPopup';
import { Product, ProductReport, UserProfile, WeatherData, ReportReason, ReportStatus } from './types';
import {
  fetchProducts,
  createProduct,
  deleteProduct,
  fetchReports,
  createReport,
  updateReportStatus,
  getCurrentUser,
  setCurrentUser,
} from './lib/supabase';
import { fetchAgriculturalWeather, KIVU_TERRITORIES, TerritoryCoordinates } from './services/weather';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentUser, setUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);

  // Weather state
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryCoordinates>(KIVU_TERRITORIES[0]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Modals state for Marketplace & Notifications
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      console.error('Failed to load products', e);
    }
  }, []);

  // Load reports (for admin)
  const loadReports = useCallback(async () => {
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (e) {
      console.error('Failed to load reports', e);
    }
  }, []);

  // Load weather
  const loadWeather = useCallback(async (territory: TerritoryCoordinates) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchAgriculturalWeather(territory);
      setWeatherData(data);
    } catch (err: any) {
      console.warn('Weather fetch error:', err);
      setWeatherError(err?.message || 'Impossible de joindre le serveur météo.');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Initial loads & listeners
  useEffect(() => {
    loadProducts();
    loadReports();
    loadWeather(selectedTerritory);

    const handleProductsUpdate = () => loadProducts();
    const handleReportsUpdate = () => loadReports();
    const handleAuthChange = () => setUser(getCurrentUser());

    window.addEventListener('agritech:products-updated', handleProductsUpdate);
    window.addEventListener('agritech:reports-updated', handleReportsUpdate);
    window.addEventListener('agritech:auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('agritech:products-updated', handleProductsUpdate);
      window.removeEventListener('agritech:reports-updated', handleReportsUpdate);
      window.removeEventListener('agritech:auth-changed', handleAuthChange);
    };
  }, [loadProducts, loadReports, loadWeather, selectedTerritory]);

  // Product Actions
  const handlePublishProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    await createProduct(productData);
    await loadProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct(productId);
    await loadProducts();
    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }
  };

  const handleReportProduct = async (
    productId: string,
    productTitle: string,
    reason: ReportReason,
    details?: string
  ) => {
    await createReport({
      productId,
      productTitle,
      reporterId: currentUser?.id,
      reporterName: currentUser?.fullName,
      reason,
      details,
    });
    await loadReports();
  };

  const handleUpdateReport = async (reportId: string, status: ReportStatus, notes?: string) => {
    await updateReportStatus(reportId, status, notes);
    await loadReports();
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  const handleTerritoryChange = (territory: TerritoryCoordinates) => {
    setSelectedTerritory(territory);
    loadWeather(territory);
  };

  // Products belonging to current user
  const userProducts = currentUser
    ? products.filter((p) => p.ownerId === currentUser.id)
    : [];

  const unreadReportsCount = reports.filter((r) => r.status === 'pending').length;

  const readNotificationIds = (() => {
    try {
      const raw = localStorage.getItem('agritech_read_notifications');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();
  const unreadNotificationsCount = products.filter(
    (p) => p.status === 'active' && !readNotificationIds.includes(p.id)
  ).length;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 flex flex-col font-sans">
      {/* Navigation Header & Mobile Bottom Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        unreadReportsCount={unreadReportsCount}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Notifications Pop-up */}
      <NotificationsPopup
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        products={products}
        onSelectProduct={(product) => {
          setSelectedProduct(product);
          setActiveTab('marketplace');
        }}
        onGoToMarket={() => setActiveTab('marketplace')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {activeTab === 'home' && (
          <HomeView
            onSelectTab={setActiveTab}
            currentUser={currentUser}
            weatherData={weatherData}
            weatherLoading={weatherLoading}
            weatherError={weatherError}
            recentProducts={products}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setActiveTab('marketplace');
            }}
            onOpenPublishModal={() => {
              setIsPublishModalOpen(true);
              setActiveTab('marketplace');
            }}
          />
        )}

        {activeTab === 'diagnostic' && (
          <AiDiagnostic
            onGoToMarket={() => {
              setIsPublishModalOpen(true);
              setActiveTab('marketplace');
            }}
          />
        )}

        {activeTab === 'marketplace' && (
          <Marketplace
            products={products}
            currentUser={currentUser}
            onPublishProduct={handlePublishProduct}
            onDeleteProduct={handleDeleteProduct}
            onSubmitReport={handleReportProduct}
            onOpenAuth={() => setActiveTab('profile')}
            isPublishModalOpen={isPublishModalOpen}
            setIsPublishModalOpen={setIsPublishModalOpen}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
          />
        )}

        {activeTab === 'training' && <TrainingView />}

        {activeTab === 'weather' && (
          <WeatherView
            weatherData={weatherData}
            loading={weatherLoading}
            error={weatherError}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={handleTerritoryChange}
            onRefresh={() => loadWeather(selectedTerritory)}
          />
        )}

        {activeTab === 'advice' && <AgronomicAdvice />}

        {activeTab === 'finance' && <FinancialServices />}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanel
            products={products}
            reports={reports}
            currentUser={currentUser}
            onDeleteProduct={handleDeleteProduct}
            onUpdateReportStatus={handleUpdateReport}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfileView
            currentUser={currentUser}
            userProducts={userProducts}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onDeleteProduct={handleDeleteProduct}
            onOpenMarketplace={() => {
              setIsPublishModalOpen(true);
              setActiveTab('marketplace');
            }}
          />
        )}
      </main>
    </div>
  );
}
