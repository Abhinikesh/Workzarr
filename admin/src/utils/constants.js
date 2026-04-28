/**
 * System-wide constants and configurations
 */

export const BOOKING_STATUSES = {
  PENDING: { label: 'Pending', color: 'amber', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', color: 'blue', variant: 'indigo' },
  ONGOING: { label: 'Ongoing', color: 'cyan', variant: 'info' },
  COMPLETED: { label: 'Completed', color: 'emerald', variant: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'red', variant: 'danger' },
};

export const PAYMENT_STATUSES = {
  CREATED: { label: 'Created', variant: 'info' },
  CAPTURED: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
  REFUNDED: { label: 'Refunded', variant: 'warning' },
};

export const USER_ROLES = {
  USER: 'Customer',
  PROVIDER: 'Service Provider',
  ADMIN: 'System Admin',
};

export const CATEGORY_ICONS = {
  Cleaning: 'Sparkles',
  Plumbing: 'Droplets',
  Electrical: 'Zap',
  Beauty: 'Flower',
  Appliances: 'Tv',
  Gardening: 'Leaf',
};

export const PAGINATION = {
  DEFAULT_LIMIT: 25,
  LIMIT_OPTIONS: [10, 25, 50, 100],
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/admin/auth/login',
    LOGOUT: '/admin/auth/logout',
    REFRESH: '/admin/auth/refresh-token',
  },
  DASHBOARD: {
    STATS: '/admin/dashboard/stats',
    REVENUE: '/admin/dashboard/revenue-chart',
    STATUS_PIE: '/admin/dashboard/booking-status-distribution',
  },
  USERS: {
    LIST: '/admin/users',
    DETAIL: (id) => \`/admin/users/\${id}\`,
    ACTION: (id) => \`/admin/users/\${id}/action\`,
  },
  PROVIDERS: {
    LIST: '/admin/providers',
    DETAIL: (id) => \`/admin/providers/\${id}\`,
    VERIFY: (id) => \`/admin/providers/\${id}/verify\`,
  },
};
