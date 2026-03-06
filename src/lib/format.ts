// MGK Transport - Formatting Utilities

/**
 * Format a number as Moroccan Dirham currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('MAD', 'DH');
}

/**
 * Format a date to French locale
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Get days until expiration
 */
export function getDaysUntilExpiration(dateExpiration: Date | string | null): number | null {
  if (!dateExpiration) return null;
  
  const expiration = new Date(dateExpiration);
  const now = new Date();
  
  return Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }
  return phone;
}

/**
 * Format RIB (24 digits)
 */
export function formatRIB(rib: string): string {
  if (!rib || rib.length !== 24) return rib;
  return rib.replace(/(.{4})/g, '$1 ').trim();
}
