/**
 * Aggregate view of a carbon project.
 *
 * There is deliberately no farm membership here. Both the farmer and the
 * corporate reader get this same shape, so neither can discover which other
 * farms are enrolled.
 */
export type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  region: string;
  commodity_focus: string;
  total_farms: number;
  total_area_ha: number;
  created_at: string;
  /** Eligibility is always provisional in MVP; see the notice below. */
  is_provisional: boolean;
};

export type EligibilityCriterion = {
  key: string;
  passed: boolean;
  reason: string;
};

export type NotAssessedComponent = {
  component: string;
  reason: string;
};

export type EligibleFarm = {
  farm_id: string;
  land_area_ha: number;
  criteria: EligibilityCriterion[];
  not_assessed: NotAssessedComponent[];
};

export type EligibleFarmFilter = {
  eligible: EligibleFarm[];
  rejected: EligibleFarm[];
  min_required: number;
  min_eligible_now: number;
  not_assessed: NotAssessedComponent[];
};

export type AggregationResult = {
  project_id: string;
  status: string;
  total_farms: number;
  total_area_ha: number;
  eligible_farm_ids: string[];
  provisional_notice: string;
};

export type CreateProjectPayload = {
  name: string;
  region: string;
  commodityFocus: string;
};