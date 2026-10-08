export const CONSENT_PURPOSE_LABELS: Record<string, string> = {
  carbon_project: 'Penggunaan data proyek karbon',
};

/**
 * Only carbon_project is enforced in MVP. The fallback wording makes that
 * visible for a purpose the UI does not know, rather than silently labelling
 * it as the carbon one.
 */
export function purposeLabel(purpose: string): string {
  return (
    CONSENT_PURPOSE_LABELS[purpose] ??
    `Keperluan lain (${purpose})`
  );
}

export function formatConsentDate(iso: string | null): string {
  if (iso == null) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}