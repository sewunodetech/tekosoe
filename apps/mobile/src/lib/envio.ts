import { env, requireLive } from './env';

// Sumber data untuk semua hal soal uang: pot, saldo, feed, status spend, hasil settle.
// Skema: packages/indexer/schema.graphql. Envio (Hasura) mengembalikan BigInt sebagai string.
// Cukup POST JSON — tidak perlu klien GraphQL (graphql-request butuh peer `graphql`).
const gql = String.raw;

async function query<T>(document: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(requireLive('envioGraphqlUrl'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: document, variables }),
  });
  if (!res.ok) throw new Error(`Connection issue (${res.status})`);
  const payload = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (payload.errors?.length || !payload.data) throw new Error(payload.errors?.[0]?.message ?? 'Connection issue');
  return payload.data;
}

export type EnvioMember = {
  id: string;
  address: string;
  deposited: string;
  used: string;
  net: string;
  pullCap: string;
  pulled: string;
  refunded: string;
  debt: string;
  credit: string;
  joinedAt: string;
};

export type EnvioShare = { participant: string; share: string; disputed: boolean };

export type EnvioSpend = {
  id: string;
  spendId: string;
  spender: string;
  to: string;
  amount: string;
  status: 'Pending' | 'Executed' | 'Rejected';
  noteHash: string;
  requestedAt: string;
  executedAt: string | null;
  receiptCount: number;
  shares: EnvioShare[];
};

export type EnvioActivity = {
  id: string;
  type: string;
  actor: string;
  counterparty: string | null;
  amount: string | null;
  spendId: string | null;
  timestamp: string;
  txHash: string;
};

export type EnvioGroup = {
  id: string;
  name: string;
  creator: string;
  endsAt: string;
  disputeWindow: string;
  approvalThreshold: string;
  pool: string;
  status: 'Active' | 'Settled';
  createdAt: string;
  settledAt: string | null;
  settleTxHash: string | null;
  members: EnvioMember[];
  spends: EnvioSpend[];
  activities: EnvioActivity[];
};

const GROUP_FIELDS = gql`
  fragment GroupFields on Group {
    id
    name
    creator
    endsAt
    disputeWindow
    approvalThreshold
    pool
    status
    createdAt
    settledAt
    settleTxHash
    members(order_by: { joinedAt: asc }) {
      id
      address
      deposited
      used
      net
      pullCap
      pulled
      refunded
      debt
      credit
      joinedAt
    }
    spends(order_by: { spendId: desc }) {
      id
      spendId
      spender
      to
      amount
      status
      noteHash
      requestedAt
      executedAt
      receiptCount
      shares {
        participant
        share
        disputed
      }
    }
    activities(order_by: { timestamp: desc }, limit: 50) {
      id
      type
      actor
      counterparty
      amount
      spendId
      timestamp
      txHash
    }
  }
`;

const MY_GROUPS = gql`
  ${GROUP_FIELDS}
  query MyGroups($address: String!) {
    Member(where: { address: { _eq: $address } }) {
      group {
        ...GroupFields
      }
    }
  }
`;

const GROUP = gql`
  ${GROUP_FIELDS}
  query Group($id: String!) {
    Group(where: { id: { _eq: $id } }) {
      ...GroupFields
    }
  }
`;

export async function fetchMyGroups(address: string): Promise<EnvioGroup[]> {
  const data = await query<{ Member: { group: EnvioGroup }[] }>(MY_GROUPS, {
    address: address.toLowerCase(),
  });
  return data.Member.map((row) => row.group);
}

export async function fetchGroup(id: string): Promise<EnvioGroup | null> {
  const data = await query<{ Group: EnvioGroup[] }>(GROUP, { id });
  return data.Group[0] ?? null;
}

export const envioConfigured = () => Boolean(env.envioGraphqlUrl);
