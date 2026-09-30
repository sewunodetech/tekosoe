/**
 * User-friendly error mapping for transactions.
 * Strict rule: NO crypto terms (no gas, wallet, seed phrase, blockchain, token, hash, revert).
 */
export function mapTxError(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('demo funds are busy')) {
    return 'Demo funds are busy right now. Please try again in a minute.';
  }
  if (lower.includes('user rejected') || lower.includes('cancelled') || lower.includes('user denied') || lower.includes('abort')) {
    return 'Action was cancelled.';
  }
  if (lower.includes('insufficient') || lower.includes('balance')) {
    return 'Not enough balance to complete this action.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('offline') || lower.includes('connection')) {
    return 'Connection issue. Please check your connection and try again.';
  }
  if (lower.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  if (lower.includes('expired')) {
    return 'This request has expired.';
  }
  if (lower.includes('group full') || lower.includes('limit reached')) {
    return 'This trip has reached its member limit.';
  }
  return 'Unable to complete request. Please try again.';
}
