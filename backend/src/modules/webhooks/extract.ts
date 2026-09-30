/**
 * Isolated parser for Alchemy custom/GraphQL webhook payloads.
 *
 * ASSUMPTION: the logs live at `event.data.block.logs[]` (see the backend spec).
 * Real payloads differ between custom, GraphQL and address activity webhooks, so the
 * walker below finds any array of topic-bearing objects instead of hard-coding one
 * path. Verify against a real delivery and keep it in `test/fixtures/`.
 */

export interface ExtractedLog {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
  txHash: string;
}

const MAX_STEPS = 500;
const MAX_LOGS = 200;

function isLogLike(value: unknown): value is { topics: unknown[] } {
  if (!value || typeof value !== "object") return false;
  return Array.isArray((value as { topics?: unknown }).topics);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = value.startsWith("0x") ? Number.parseInt(value, 16) : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalize(raw: unknown): ExtractedLog | null {
  if (!raw || typeof raw !== "object") return null;
  const log = raw as {
    address?: unknown;
    topics?: unknown;
    data?: unknown;
    index?: unknown;
    logIndex?: unknown;
    transaction?: { hash?: unknown };
    txHash?: unknown;
    transactionHash?: unknown;
  };

  if (!Array.isArray(log.topics) || log.topics.length === 0) return null;
  if (typeof log.address !== "string") return null;

  const tx =
    (typeof log.transaction?.hash === "string" ? log.transaction.hash : undefined) ??
    (typeof log.txHash === "string" ? log.txHash : undefined) ??
    (typeof log.transactionHash === "string" ? log.transactionHash : undefined);

  return {
    address: log.address,
    topics: log.topics.map(String),
    data: typeof log.data === "string" ? log.data : "0x",
    logIndex: toNumber(log.index ?? log.logIndex),
    txHash: tx ?? "",
  };
}

/** Breadth-first walk; stops as soon as it finds arrays that look like log lists. */
function findLogContainers(root: object): unknown[] {
  const containers: unknown[] = [];
  const queue: unknown[] = [root];
  let steps = 0;

  while (queue.length > 0 && steps < MAX_STEPS) {
    steps += 1;
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;

    if (Array.isArray(node)) {
      if (node.length === 0 || isLogLike(node[0])) {
        containers.push(node);
        continue;
      }
      queue.push(...node);
      continue;
    }

    for (const value of Object.values(node)) {
      if (value && typeof value === "object") queue.push(value);
    }
  }

  return containers;
}

export function extractLogs(payload: unknown): ExtractedLog[] {
  if (!payload || typeof payload !== "object") return [];

  const found: ExtractedLog[] = [];
  for (const container of findLogContainers(payload as object)) {
    if (!Array.isArray(container)) continue;
    for (const raw of container) {
      if (found.length >= MAX_LOGS) return found;
      const log = normalize(raw);
      if (log) found.push(log);
    }
  }
  return found;
}
