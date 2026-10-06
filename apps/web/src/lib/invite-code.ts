/** Kode undangan dari app: `${groupId}-${rahasia 64 hex}` (apps/mobile/src/lib/invite.ts). */
export const INVITE_CODE_RE = /^(\d+)-([0-9a-fA-F]{64})$/;

/**
 * Hanya `groupId` yang keluar dari fungsi ini. Rahasia undangan dipakai app di perangkat untuk
 * bergabung dan tidak pernah dikirim web ke mana pun.
 */
export function parseInviteCode(code: string): { groupId: string } | null {
  const m = INVITE_CODE_RE.exec(code);
  return m ? { groupId: BigInt(m[1]!).toString() } : null;
}
