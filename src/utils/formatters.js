import { format, formatDistanceToNow } from 'date-fns';

/**
 * Currency formatter for INR
 */
export const formatCurrency = (amount = 0, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Human-readable number formatting
 */
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};

/**
 * Standard date formatter
 */
export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), formatStr);
  } catch (err) {
    return 'Invalid Date';
  }
};

/**
 * Relative time formatter (e.g. "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (err) {
    return '';
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, len = 20) => {
  if (!text) return '';
  if (text.length <= len) return text;
  return text.slice(0, len) + '...';
};

/**
 * Format Indian Phone Numbers
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Format duration in minutes to h m
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
