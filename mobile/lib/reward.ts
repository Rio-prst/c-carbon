import type { RewardTier, RewardEventType } from '../types/reward';

type TierMeta = {
  label: string;
  description: string;
  tone: 'neutral' | 'info' | 'warning' | 'success';
};

const TIERS: Record<RewardTier, TierMeta> = {
  BASIC: {
    label: 'Basic',
    description: '0-399 poin',
    tone: 'neutral',
  },
  SILVER: {
    label: 'Silver',
    description: '400-699 poin',
    tone: 'info',
  },
  GOLD: {
    label: 'Gold',
    description: '700-899 poin',
    tone: 'warning',
  },
  CARBON_READY: {
    label: 'Carbon Ready',
    description: '900+ poin',
    tone: 'success',
  },
};

export function rewardTierMeta(tier: RewardTier): TierMeta {
  return TIERS[tier];
}

export function rewardEventMeta(eventType: RewardEventType): string {
  switch (eventType) {
    case 'FARM_DATA_SUBMISSION':
      return 'Kirim data lahan';
    case 'VERIFICATION':
      return 'Verifikasi data';
    case 'FSS_IMPROVEMENT':
      return 'Peningkatan FSS';
    case 'SUSTAINABLE_PRACTICE':
      return 'Praktik berkelanjutan';
    case 'MILESTONE_BONUS':
      return 'Bonus milestone';
  }
}

export function formatRewardDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function nextTierProgress(points: number): {
  next: RewardTier | null;
  remaining: number | null;
} {
  const thresholds: { tier: RewardTier; min: number }[] = [
    { tier: 'CARBON_READY', min: 900 },
    { tier: 'GOLD', min: 700 },
    { tier: 'SILVER', min: 400 },
    { tier: 'BASIC', min: 0 },
  ];

  const currentIndex = thresholds.findIndex((t) => points >= t.min);
  const nextEntry = thresholds[currentIndex - 1];

  if (!nextEntry) {
    return { next: null, remaining: null };
  }

  return { next: nextEntry.tier, remaining: nextEntry.min - points };
}