/** Allowlist KNET hosted payment page hosts before browser redirect / WebView load. */

const DEFAULT_ALLOWED_HOST_SUFFIXES = [
  'kpay.com.kw',
  'kpaytest.com.kw',
] as const;

function hostAllowed(hostname: string, suffixes: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

/**
 * Returns a safe absolute payment URL, or null if missing/malformed/not allowlisted.
 */
export function sanitizeKnetPaymentUrl(
  raw: string | null | undefined,
  extraHostSuffixes: readonly string[] = [],
): string | null {
  const value = (raw || '').trim();
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  const suffixes = [...DEFAULT_ALLOWED_HOST_SUFFIXES, ...extraHostSuffixes];
  if (!hostAllowed(parsed.hostname, suffixes)) return null;
  return parsed.toString();
}
