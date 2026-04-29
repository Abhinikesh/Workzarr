/**
 * Recharts and Data Visualization Helpers
 */

export const CHART_COLORS = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

export const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#6366f1',
  ongoing: '#06b6d4',
  completed: '#10b981',
  cancelled: '#ef4444',
};

/**
 * Format tooltip values for currency or numbers
 */
export const customTooltipFormatter = (value, name) => {
  if (name.toLowerCase().includes('revenue') || name.toLowerCase().includes('amount')) {
    return [`₹${value.toLocaleString()}`, name];
  }
  return [value.toLocaleString(), name];
};

/**
 * Generate sequential dates for chart x-axis
 */
export const generateDateRange = (days = 7) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
  }
  return dates;
};
