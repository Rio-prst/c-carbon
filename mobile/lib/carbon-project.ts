import type {
  EligibleFarm,
  EligibilityCriterion,
} from '../types/carbon-project';

/**
 * Shown wherever a project is presented. docs/BUSINESS-RULES.md §7 forbids
 * fabricating eligibility, and the baseline the PRD asks for cannot be
 * assessed in MVP, so the gap has to be stated rather than implied.
 */
export const PROVISIONAL_NOTICE =
  'Kelayakan dihitung dari kondisi yang dapat dinilai platform. Baseline belum dinilai dan metodologi karbon penuh di luar cakupan MVP. Keanggotaan proyek bukan kredit karbon.';

type StatusMeta = {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'error';
};

/** Only the three MVP states are ever surfaced. */
export function projectStatusMeta(status: string): StatusMeta {
  switch (status) {
    case 'AGGREGATING':
      return { label: 'Agregasi berjalan', tone: 'success' };
    case 'ASSESSMENT':
      return { label: 'Dalam penilaian', tone: 'warning' };
    case 'CANDIDATE':
      return { label: 'Kandidat', tone: 'neutral' };
    default:
      // Unreachable through the API. Rendered as-is rather than mapped to a
      // success tone, so an unexpected state cannot look like a good one.
      return { label: status, tone: 'neutral' };
  }
}

const STATUS_ORDER = ['CANDIDATE', 'ASSESSMENT', 'AGGREGATING'] as const;

/**
 * The single transition the API would accept. Offering anything else means
 * sending a request the backend will reject with 409, so the UI offers only
 * what can succeed.
 */
export function nextProjectStatus(status: string): string | null {
  const index = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
  if (index === -1 || index === STATUS_ORDER.length - 1) {
    return null;
  }
  return STATUS_ORDER[index + 1];
}

export function isForwardTransitionAvailable(status: string): boolean {
  return nextProjectStatus(status) != null;
}

export function canAggregate(status: string): boolean {
  // A project already aggregating refuses re-aggregation on the server, since
  // that would silently change its membership.
  return status !== 'AGGREGATING';
}

export const CRITERION_LABELS: Record<string, string> = {
  verification: 'Data terverifikasi',
  data_completeness: 'Kelengkapan data',
  eligible_practice: 'Praktik eligible',
  aggregation_suitability: 'Kesesuaian agregasi',
};

export function criterionLabel(key: string): string {
  return CRITERION_LABELS[key] ?? key;
}

export function failedCriteria(
  farm: EligibleFarm,
): EligibilityCriterion[] {
  return farm.criteria.filter((criterion) => !criterion.passed);
}

export function formatArea(hectares: number): string {
  return `${hectares.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} ha`;
}

export function formatProjectDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}