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

export type EnvioReceipt = { receiptHash: string; by: string; timestamp: string };

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
  receipts?: EnvioReceipt[];
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
      receipts(order_by: { timestamp: desc }) {
        receiptHash
        by
        timestamp
      }
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

/** Top up / Cash out dari Transfer AUSD (faucet & alamat cash out), lihat packages/indexer. */
export type EnvioBalanceActivity = {
  id: string;
  kind: 'TopUp' | 'CashOut';
  amount: string;
  timestamp: string;
  txHash: string;
};

const BALANCE_ACTIVITY = gql`
  query BalanceActivity($address: String!) {
    BalanceActivity(where: { account: { _eq: $address } }, order_by: { timestamp: desc }, limit: 50) {
      id
      kind
      amount
      timestamp
      txHash
    }
  }
`;

export async function fetchBalanceActivity(address: string): Promise<EnvioBalanceActivity[]> {
  const data = await query<{ BalanceActivity: EnvioBalanceActivity[] }>(BALANCE_ACTIVITY, {
    address: address.toLowerCase(),
  });
  return data.BalanceActivity;
}

const META = gql`
  query Meta {
    _meta {
      progressBlock
    }
  }
`;

/**
 * Tunggu sampai Envio memproses blok transaksi ini, supaya data yang diambil ulang sesudahnya
 * sudah memuat transaksi tersebut. Indexer prod maju bertahap: kadang 0–1 s di belakang chain,
 * kadang tertahan ±50 s (diukur 1 Okt 2026), jadi batasnya 45 s.
 * Tidak pernah gagal: setelah batas waktu, layar tetap lanjut dan polling biasa menyusul.
 */
export async function waitForIndexer(blockNumber: bigint, timeoutMs = 45_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const data = await query<{ _meta: { progressBlock: number }[] }>(META, {});
      if (data._meta.some((meta) => BigInt(meta.progressBlock) >= blockNumber)) return;
    } catch {
      // Koneksi putus sesaat: coba lagi sampai batas waktu.
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
}

export const envioConfigured = () => Boolean(env.envioGraphqlUrl);

const MY_DEBTS = gql`
  query MyDebts($address: String!) {
    Member(where: { address: { _eq: $address }, debt: { _gt: "0" } }) {
      debt
      group {
        id
        name
      }
    }
  }
`;

/** Trip yang masih menyisakan utang untuk alamat ini (setelah settle-up). Kosong = boleh buat/ikut trip baru. */
export async function fetchMyDebts(address: string): Promise<{ tripId: string; tripName: string; debt: bigint }[]> {
  const data = await query<{ Member: { debt: string; group: { id: string; name: string } }[] }>(MY_DEBTS, {
    address: address.toLowerCase(),
  });
  return data.Member.map((row) => ({ tripId: row.group.id, tripName: row.group.name, debt: BigInt(row.debt) }));
}
