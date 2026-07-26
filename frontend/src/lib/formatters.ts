/**
 * Currency and date formatting utilities.
 *
 * Money: backend stores paise (integers). Frontend displays INR.
 * Always use these helpers — never format money inline.
 */

interface FormatCurrencyOptions {
  /** Omit .00 when amount has no paise (e.g. ₹6,03,700 instead of ₹6,03,700.00) */
  omitZeroPaise?: boolean;
}

/**
 * Convert paise integer to formatted INR string.
 * @example formatCurrency(125000) → "₹1,250.00"
 * @example formatCurrency(125000, { omitZeroPaise: true }) → "₹1,250"
 */
export function formatCurrency(
  paise: number | null | undefined,
  opts?: FormatCurrencyOptions,
): string {
  if (paise == null) return '—';
  const inr = paise / 100;
  const isWholeRupee = paise % 100 === 0;

  const fractionDigits = opts?.omitZeroPaise && isWholeRupee ? 0 : 2;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(inr);
}

/**
 * Convert INR decimal to paise integer.
 * @example inrToPaise(1250.50) → 125050
 */
export function inrToPaise(inr: number): number {
  return Math.round(inr * 100);
}

/**
 * Convert paise integer to INR decimal.
 * @example paiseToInr(125050) → 1250.5
 */
export function paiseToInr(paise: number): number {
  return paise / 100;
}

/**
 * Format an ISO date string for display.
 * @example formatDate("2026-07-15T10:30:00Z") → "15 Jul 2026"
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Format an ISO date string with time.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
