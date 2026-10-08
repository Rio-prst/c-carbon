export type ConsentView = {
  purpose: string;
  consent_version: string;
  granted_at: string;
  revoked_at: string | null;
  active: boolean;
};

export type ConsentStatus = {
  consents: ConsentView[];
  /** Purposes with an open grant. Only carbon_project is enforced in MVP. */
  active_purposes: string[];
  carbon_project_granted: boolean;
  notice: string;
};

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};