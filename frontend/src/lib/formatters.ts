/**
 * Currency and date formatting utilities.
 *
 * Money: backend stores paise (integers). Frontend displays INR.
 * Always use these helpers — never format money inline.
 */

/**
 * Convert paise integer to formatted INR string.
 * @example formatCurrency(125000) → "₹1,250.00"
 */
export function formatCurrency(paise: number | null | undefined): string {
  if (paise == null) return '—';
  const inr = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
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
