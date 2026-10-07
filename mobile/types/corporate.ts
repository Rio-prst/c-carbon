/**
 * Aggregate view for a corporate reader.
 *
 * Carries no farm membership and no farmer identity, per
 * docs/BUSINESS-RULES.md §10. total_farms is de-duplicated because a farm
 * can belong to more than one project.
 */
export type CorporateOverview = {
  company_name: string;
  industry: string;
  region: string;
  total_farms: number;
  total_area_ha: number;
  project_count: number;
  commodities: string[];
  regions: string[];
  status_breakdown: { status: string; count: number }[];
  is_provisional: boolean;
  disclaimer: string;
};