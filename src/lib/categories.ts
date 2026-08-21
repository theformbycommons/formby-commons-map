export interface CategoryConfig {
  id: string;
  label: string;
  color: string;
  iconName: string;
}

export const CATEGORIES: Record<string, CategoryConfig> = {
  speeding: {
    id: 'speeding',
    label: 'Speeding',
    color: '#ef4444', // Red
    iconName: 'Zap',
  },
  'overgrown-pavement': {
    id: 'overgrown-pavement',
    label: 'Overgrown Pavement',
    color: '#16a34a', // Green
    iconName: 'Trees',
  },
  'unsafe-crossing': {
    id: 'unsafe-crossing',
    label: 'Unsafe Crossing',
    color: '#f59e0b', // Amber
    iconName: 'AlertTriangle',
  },
  'missing-drop-kerb': {
    id: 'missing-drop-kerb',
    label: 'Missing Drop Kerb',
    color: '#2563eb', // Blue
    iconName: 'Accessibility',
  },
  'cars-parked-on-pavement': {
    id: 'cars-parked-on-pavement',
    label: 'Cars Parked On Pavement',
    color: '#9333ea', // Purple
    iconName: 'Car',
  },
  'roundabout-improvement-needed': {
    id: 'roundabout-improvement-needed',
    label: 'Roundabout Improvement',
    color: '#0891b2', // Cyan
    iconName: 'RotateCw',
  },
  other: {
    id: 'other',
    label: 'Other',
    color: '#64748b', // Slate
    iconName: 'HelpCircle',
  },
};

export const DEFAULT_CATEGORY: CategoryConfig = CATEGORIES.other;

/**
 * Normalizes user-submitted strings or category IDs to retrieve category configuration safely.
 */
export function getCategoryConfig(categoryKey?: string): CategoryConfig {
  if (!categoryKey) return DEFAULT_CATEGORY;

  const normalizedKey = categoryKey.toLowerCase().trim().replace(/\s+/g, '-');
  if (CATEGORIES[normalizedKey]) {
    return CATEGORIES[normalizedKey];
  }

  // Fallback for custom or direct string matches
  return {
    id: normalizedKey,
    label: categoryKey,
    color: '#64748b',
    iconName: 'HelpCircle',
  };
}
