import type { Env } from "../config/env";

export interface DueGroup {
  id: string;
  endsAt: number;
  status: string;
}

export interface EnvioClient {
  /** Groups indexed as Active whose endsAt has already passed. */
  dueGroups(now: number, limit: number, offset: number): Promise<DueGroup[]>;
  /** Hash of the transaction that emitted Settled for the group (settled by anyone), or null. */
  settleTxHash(groupId: string): Promise<string | null>;
  ping(): Promise<boolean>;
}

/**
 * ASSUMPTION: verify against the actual schema.graphql produced by packages/indexer.
 * Field names and the status enum spelling ("Active") come from the draft entity table.
 * The Envio Group entity has no disputeWindow — that value must be read on-chain.
 */
const DUE_GROUPS_QUERY = `
  query DueGroups($now: numeric!, $limit: Int!, $offset: Int!) {
    Group(
      where: { status: { _eq: "Active" }, endsAt: { _lte: $now } }
      order_by: { endsAt: asc }
      limit: $limit
      offset: $offset
    ) {
      id
      endsAt
      status
    }
  }
`;

/** ASSUMPTION: Activity.type holds the event name and group_id the decimal group id (schema.graphql draft). */
const SETTLE_TX_QUERY = `
  query SettleTx($groupId: String!) {
    Activity(where: { group_id: { _eq: $groupId }, type: { _eq: "Settled" } }, limit: 1) {
      txHash
    }
  }
`;

const PING_QUERY = `{ __typename }`;

async function graphql<T>(
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Envio responded with HTTP ${response.status}`);
  }
  const payload = (await response.json()) as {
    data?: T;
    errors?: { message?: string }[];
  };
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(`Envio query failed: ${payload.errors[0]?.message ?? "unknown error"}`);
  }
  if (payload.data === undefined || payload.data === null) {
    throw new Error("Envio returned no data");
  }
  return payload.data;
}

export function createEnvioClient(env: Env): EnvioClient {
  const endpoint = env.ENVIO_GRAPHQL_URL;

  return {
    async dueGroups(now, limit, offset) {
      const data = await graphql<{ Group?: { id: unknown; endsAt: unknown; status: unknown }[] }>(
        endpoint,
        DUE_GROUPS_QUERY,
        { now: String(now), limit, offset },
      );
      return (data.Group ?? []).map((row) => ({
        id: String(row.id),
        endsAt: Number(row.endsAt),
        status: String(row.status),
      }));
    },
    async settleTxHash(groupId) {
      const data = await graphql<{ Activity?: { txHash: unknown }[] }>(endpoint, SETTLE_TX_QUERY, {
        groupId,
      });
      const hash = data.Activity?.[0]?.txHash;
      return typeof hash === "string" ? hash : null;
    },
    async ping() {
      try {
        await graphql(endpoint, PING_QUERY);
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** Paginate the due-group query so a large backlog cannot stall the sweep. */
export async function fetchAllDueGroups(
  envio: EnvioClient,
  now: number,
  options: { pageSize?: number; maxPages?: number } = {},
): Promise<DueGroup[]> {
  const pageSize = options.pageSize ?? 50;
  const maxPages = options.maxPages ?? 20;
  const all: DueGroup[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await envio.dueGroups(now, pageSize, page * pageSize);
    all.push(...batch);
    if (batch.length < pageSize) break;
  }

  return all;
}
