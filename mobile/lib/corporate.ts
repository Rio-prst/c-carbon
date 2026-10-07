import { formatArea, projectStatusMeta } from './carbon-project';
import type { CorporateOverview } from '../types/corporate';

/**
 * Shown on the corporate overview. A corporate reader is evaluating scale, and
 * presenting candidate data without this caveat could read as an offer of
 * issued credits, which MVP must never imply (docs/MVP-SCOPE.md, demo boundary).
 */
export const CORPORATE_DISCLAIMER =
  'Data agregat untuk evaluasi skala. Bukan kredit karbon dan bukan jaminan issuance.';

/**
 * Farms are counted once even when they sit in several projects, so the label
 * says "distinct" rather than implying the same as a project subtotal.
 */
export function overviewStats(overview: CorporateOverview): {
  label: string;
  value: string;
}[] {
  return [
    { label: 'Proyek', value: `${overview.project_count}` },
    { label: 'Lahan distinct', value: `${overview.total_farms}` },
    { label: 'Total luas', value: formatArea(overview.total_area_ha) },
    { label: 'Komoditas', value: overview.commodities.join(', ') || '-' },
    { label: 'Wilayah', value: overview.regions.join(', ') || '-' },
  ];
}

export function statusBreakdownLabel(overview: CorporateOverview): string {
  if (overview.status_breakdown.length === 0) return 'Belum ada proyek';
  return overview.status_breakdown
    .map(
      (entry) =>
        `${projectStatusMeta(entry.status).label}: ${entry.count}`,
    )
    .join(' · ');
}