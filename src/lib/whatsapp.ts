/**
 * Utilitaires WhatsApp et normalisation des numéros pour AgriTech Kivu
 */

// Nettoie un numéro de téléphone pour ne conserver que les chiffres purs
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// Normalise un numéro pour la RDC ou l'international
export function normalizeWhatsAppNumber(phone: string, defaultCountryCode: string = '243'): string {
  const digits = sanitizePhoneNumber(phone);
  if (!digits) return '';

  // Si le numéro commence déjà par 243
  if (digits.startsWith('243') && digits.length >= 11) {
    return digits;
  }

  // Si le numéro commence par un 0 (ex: 0991234567 en RDC)
  if (digits.startsWith('0') && digits.length === 10) {
    return `${defaultCountryCode}${digits.substring(1)}`;
  }

  // Si l'utilisateur a entré 9 chiffres (ex: 991234567)
  if (digits.length === 9) {
    return `${defaultCountryCode}${digits}`;
  }

  return digits;
}

// Vérifie si le numéro est valide
export function isValidWhatsAppNumber(phone: string): boolean {
  const normalized = normalizeWhatsAppNumber(phone);
  // Un numéro international valide a généralement entre 10 et 15 chiffres
  // Pour la RDC (243 + 9 chiffres) = 12 chiffres
  return normalized.length >= 10 && normalized.length <= 15;
}

// Génère le lien WhatsApp acheteur pour un produit donné
export function buildBuyerWhatsAppLink(whatsappNumber: string, productTitle: string): string {
  const cleanNumber = normalizeWhatsAppNumber(whatsappNumber);
  const message = `Bonjour, je vous contacte depuis AgriTech Kivu au sujet de votre produit ${productTitle}. Est-il toujours disponible ? J'aimerais obtenir plus d'informations.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

// Génère le lien WhatsApp administrateur pour contacter le vendeur d'un produit
export function buildAdminWhatsAppLink(whatsappNumber: string, productTitle: string): string {
  const cleanNumber = normalizeWhatsAppNumber(whatsappNumber);
  const message = `Bonjour, je vous contacte au sujet de votre annonce publiée sur AgriTech Kivu : ${productTitle}. J'aimerais échanger avec vous concernant cette annonce.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
