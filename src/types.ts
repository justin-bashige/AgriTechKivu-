// Types pour AgriTech Kivu

export type UserRole = 'farmer' | 'buyer' | 'admin';

export interface UserProfile {
  id: string;
  email?: string;
  fullName: string;
  phone?: string;
  whatsappNumber: string;
  role: UserRole;
  avatarUrl?: string;
  location?: string;
  createdAt: string;
}

export type ProductCategory =
  | 'Légumes'
  | 'Fruits'
  | 'Céréales & Féculents'
  | 'Légumineuses'
  | 'Tubercules'
  | 'Élevage & Volaille'
  | 'Semences & Plants'
  | 'Outils & Intrants'
  | 'Autre';

export type Currency = 'USD' | 'CDF';

export type ProductUnit =
  | 'kg'
  | 'sac 25kg'
  | 'sac 50kg'
  | 'sac 100kg'
  | 'panier'
  | 'botte'
  | 'pièce'
  | 'litre'
  | 'tonne';

export interface Product {
  id: string;
  ownerId: string;
  ownerName?: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number;
  currency: Currency;
  unit: ProductUnit;
  quantityAvailable: number;
  location: string;
  images: string[];
  whatsappNumber: string; // Numéro format international pur: 243XXXXXXXXX
  status: 'active' | 'sold' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

export type ReportReason =
  | 'Produit frauduleux'
  | 'Prix trompeur'
  | 'Produit interdit ou inapproprié'
  | 'Informations incorrectes'
  | 'Autre problème';

export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface ProductReport {
  id: string;
  productId: string;
  productTitle?: string;
  reporterId?: string;
  reporterName?: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: string;
}

export interface DiagnosisResult {
  cropIdentified: string;
  probableDisease: string;
  scientificName?: string;
  confidenceLevel: 'Élevé' | 'Moyen' | 'Faible';
  confidenceScore: number;
  symptomsObserved: string[];
  causes: string[];
  uncertaintyNotes: string;
  preventiveMeasures: string[];
  recommendedTreatments: string[];
  nextSteps: string[];
  disclaimer: string;
}

export interface TrainingVideo {
  id: string;
  title: string;
  category: string;
  youtubeUrl: string;
  searchQuery: string;
  durationMinutes: number;
  thumbnailUrl: string;
  description: string;
}

export interface WeatherData {
  locationName: string;
  latitude: number;
  longitude: number;
  current: {
    temperature: number;
    apparentTemperature: number;
    relativeHumidity: number;
    precipitation: number;
    weatherCode: number;
    weatherDescription: string;
    windSpeed: number;
    time: string;
  };
  daily: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
    precipitationProbabilityMax: number;
    weatherCode: number;
    weatherDescription: string;
  }>;
  agriculturalAdvice: string[];
}
