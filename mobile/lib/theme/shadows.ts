import { neutral } from './colors';

export const shadows = {
  fab: {
    shadowColor: neutral.ink900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  sheet: {
    shadowColor: neutral.ink900,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;