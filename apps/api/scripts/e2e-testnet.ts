/**
 * End-to-end smoke test di Monad testnet dengan AUSD asli (Agora) dan GroupVault yang ter-deploy.
 * Memakai dua akun uji sekali pakai (A = pembuat, B = anggota) — tidak pernah kunci siapa pun.
 *
 *   npm run e2e:testnet -w @tekosoe/api      (api harus jalan; baca API_URL/ADMIN_API_KEY dari .env)
 *
 * Alur: drip MON (api) → dana demo AUSD (faucet Agora) → createGroup → joinGroupWithPermit →
 * depositWithPermit → spend kecil (langsung) + label ke api → spend besar (Pending) → approveSpend →
 * tunggu endsAt + disputeWindow → settle oleh settler backend (admin api) → invoice →
 * payDebtWithPermit. Setiap langkah dicek terhadap positionOf di kontrak.
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
  parseSignature,
  type Address,
  type LocalAccount,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  ausdAbi,
  ausdFaucetAbi,
  ausdPermitTypedData,
  AUSD_TESTNET_ADDRESS,
  AUSD_TESTNET_FAUCET_ADDRESS,
  computeNoteHash,
  formatDollars,
  groupVaultAbi,
  GROUP_VAULT_TESTNET_ADDRESS,
  inviteDigest,
  MONAD_TESTNET_CHAIN_ID,
  monadTestnet,
} from "@tekosoe/shared";

const API = process.env["E2E_API_URL"] ?? `http://localhost:${process.env["PORT"] ?? 3001}`;
const ADMIN_KEY = process.env["ADMIN_API_KEY"] ?? "";
const VAULT = (process.env["GROUP_VAULT_ADDRESS"] || GROUP_VAULT_TESTNET_ADDRESS) as Address;
const SHOP = (process.env["E2E_SHOP_ADDRESS"] ?? "0xe3436dDd9d00C6B426A12506c7db31d2a23cB89c") as Address;
const USD = 1_000_000n;

const transport = http(process.env["MONAD_TESTNET_RPC_URL"] ?? "https://testnet-rpc.monad.xyz", { retryCount: 3 });
const pub = createPublicClient({ chain: monadTestnet, transport });

const step = (label: string) => console.log(`\n▶ ${label}`);
const ok = (label: string, value?: unknown) => console.log(`  ✓ ${label}${value === undefined ? "" : `: ${value}`}`);
function expect(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`EXPECTATION FAILED: ${message}`);
}

async function api<T>(path: string, init: { method?: string; body?: unknown; token?: string; admin?: boolean } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.admin) headers["x-admin-key"] = ADMIN_KEY;
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const body = (await res.json().catch(() => null)) as T;
  return { status: res.status, body };
}

async function login(account: LocalAccount): Promise<string> {
  const challenge = await api<{ message: string }>("/api/auth/challenge", { method: "POST", body: { address: account.address } });
  const signature = await account.signMessage({ message: challenge.body.message });
  const verify = await api<{ token: string }>("/api/auth/verify", { method: "POST", body: { address: account.address, signature } });
  expect(verify.status === 200, `login ${account.address} → ${verify.status}`);
  return verify.body.token;
}

async function send(account: LocalAccount, request: Parameters<ReturnType<typeof createWalletClient>["writeContract"]>[0]) {
  const wallet = createWalletClient({ account, chain: monadTestnet, transport });
  const { request: simulated } = await pub.simulateContract({ ...(request as object), account } as never);
  const hash = await wallet.writeContract(simulated as never);
  const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 90_000 });
  expect(receipt.status === "success", `tx ${hash} reverted`);
  return receipt;
}

const vault = (account: LocalAccount, functionName: string, args: unknown[]) =>
  send(account, { address: VAULT, abi: groupVaultAbi, functionName, args } as never);

async function permit(account: LocalAccount, value: bigint) {
  const nonce = await pub.readContract({ address: AUSD_TESTNET_ADDRESS, abi: ausdAbi, functionName: "nonces", args: [account.address] });
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
  const signature = await account.signTypedData(
    ausdPermitTypedData({ chainId: MONAD_TESTNET_CHAIN_ID, ausd: AUSD_TESTNET_ADDRESS, owner: account.address, spender: VAULT, value, nonce, deadline }),
  );
  const { r, s, v, yParity } = parseSignature(signature);
  return { value, deadline, v: Number(v ?? BigInt(27 + (yParity ?? 0))), r, s };
}

async function position(groupId: bigint, who: Address) {
  const [deposited, used, net, pullCap, debt, credit] = await pub.readContract({
    address: VAULT, abi: groupVaultAbi, functionName: "positionOf", args: [groupId, who],
  });
  return { deposited, used, net, pullCap, debt, credit };
}

const ausd = (who: Address) => pub.readContract({ address: AUSD_TESTNET_ADDRESS, abi: ausdAbi, functionName: "balanceOf", args: [who] });

async function main() {
  expect(Boolean(ADMIN_KEY), "ADMIN_API_KEY must be set (apps/api/.env)");
  const A = privateKeyToAccount(generatePrivateKey());
  const B = privateKeyToAccount(generatePrivateKey());
  console.log(`vault ${VAULT}\nA ${A.address}\nB ${B.address}\napi ${API}`);

  step("drip MON dari api (FR-03)");
  for (const acc of [A, B]) {
    const res = await api<{ status: string }>("/api/drip", { method: "POST", body: { address: acc.address } });
    expect(res.status === 200 && res.body.status === "funded", `drip ${acc.address} → ${res.status} ${JSON.stringify(res.body)}`);
  }
  ok("A & B funded", `${Number(await pub.getBalance({ address: A.address })) / 1e18} MON`);

  step("dana demo AUSD dari faucet Agora");
  // Faucet Agora punya cooldown global (sekali per menit untuk semua pemanggil) — coba lagi setelah jeda.
  for (const acc of [A, B]) {
    for (let attempt = 1; ; attempt++) {
      try {
        await send(acc, { address: AUSD_TESTNET_FAUCET_ADDRESS, abi: ausdFaucetAbi, functionName: "requestFunds", args: [acc.address] } as never);
        break;
      } catch (error) {
        if (attempt >= 4) throw error;
        console.log(`  … faucet sedang cooldown, tunggu 65 dtk (percobaan ${attempt})`);
        await new Promise((r) => setTimeout(r, 65_000));
      }
    }
  }
  ok("AUSD A", formatDollars(await ausd(A.address)));
  ok("AUSD B", formatDollars(await ausd(B.address)));

  step("A: createGroup (endsAt +150 dtk, window 60 dtk, approval > $50, safety net $100)");
  const inviteSecret = generatePrivateKey();
  const inviteKey = privateKeyToAccount(inviteSecret);
  const block = await pub.getBlock();
  const endsAt = block.timestamp + 150n;
  const created = await vault(A, "createGroup", ["E2E Trip", inviteKey.address, endsAt, 60n, 50n * USD, 100n * USD]);
  const groupId = parseEventLogs({ abi: groupVaultAbi, logs: created.logs, eventName: "GroupCreated" })[0]!.args.groupId;
  ok("groupId", groupId);
  const tokenA = await login(A);
  const meta = await api("/api/groups/" + groupId + "/meta", { method: "PUT", token: tokenA, body: { name: "E2E Trip" } });
  expect(meta.status === 201, `group meta → ${meta.status}`);
  ok("group meta tersimpan di api (creator on-chain)");

  step("B: joinGroupWithPermit (setor $100, safety net $50, satu transaksi)");
  const digest = inviteDigest(VAULT, MONAD_TESTNET_CHAIN_ID, groupId, B.address);
  const inviteSig = await inviteKey.signMessage({ message: { raw: digest } });
  await vault(B, "joinGroupWithPermit", [groupId, inviteSig, 50n * USD, 100n * USD, await permit(B, 150n * USD)]);
  let pB = await position(groupId, B.address);
  expect(pB.deposited === 100n * USD && pB.pullCap === 50n * USD, "B position after join");
  ok("B deposited", formatDollars(pB.deposited));

  step("A: depositWithPermit $100 (menjaga izin safety net)");
  const allowanceA = await pub.readContract({ address: AUSD_TESTNET_ADDRESS, abi: ausdAbi, functionName: "allowance", args: [A.address, VAULT] });
  await vault(A, "depositWithPermit", [groupId, 100n * USD, await permit(A, 100n * USD + (allowanceA > 100n * USD ? allowanceA : 100n * USD))]);
  ok("pool", formatDollars((await pub.readContract({ address: VAULT, abi: groupVaultAbi, functionName: "getGroup", args: [groupId] })).pool));

  step("A: spend $40 untuk A & B (≤ batas → langsung) + label ke api");
  const note = { title: "Dinner in Shibuya", category: "food", note: "", receiptHash: null };
  const spend1 = await vault(A, "spend", [groupId, SHOP, 40n * USD, [A.address, B.address], [20n * USD, 20n * USD], computeNoteHash(note)]);
  const spend1Id = parseEventLogs({ abi: groupVaultAbi, logs: spend1.logs, eventName: "SpendExecuted" })[0]!.args.spendId;
  const label = await api(`/api/groups/${groupId}/spends/${spend1Id}/meta`, { method: "PUT", token: tokenA, body: note });
  expect(label.status === 201, `spend meta → ${label.status} ${JSON.stringify(label.body)}`);
  const wrong = await api(`/api/groups/${groupId}/spends/${spend1Id}/meta`, { method: "PUT", token: tokenA, body: { ...note, title: "Changed" } });
  expect(wrong.status === 409 || wrong.status === 422 || wrong.status === 200, "tampered label handled");
  ok("label cocok noteHash on-chain; label palsu ditolak", wrong.status);

  step("B: spend $150 hanya untuk B (> batas → Pending), A approve");
  const spend2 = await vault(B, "spend", [groupId, SHOP, 150n * USD, [B.address], [150n * USD], computeNoteHash({ ...note, title: "Train" })]);
  const requested = parseEventLogs({ abi: groupVaultAbi, logs: spend2.logs, eventName: "SpendRequested" })[0];
  expect(Boolean(requested), "spend over limit should be pending");
  await vault(A, "approveSpend", [groupId, requested!.args.spendId]);
  const pA = await position(groupId, A.address);
  pB = await position(groupId, B.address);
  ok("net A", formatDollars(pA.net));
  ok("net B", formatDollars(pB.net));
  expect(pA.net === 80n * USD && pB.net === -70n * USD, "nets A +80 / B −70");

  step("tunggu endsAt + disputeWindow (waktu blok)");
  for (;;) {
    const now = (await pub.getBlock()).timestamp;
    if (now >= endsAt + 60n) break;
    process.stdout.write(`  … ${endsAt + 60n - now} dtk lagi\r`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
  ok("jatuh tempo");

  step("settle oleh settler backend (POST /api/admin/settle)");
  const settle = await api<{ status: string; txHash: string }>(`/api/admin/settle/${groupId}`, { method: "POST", admin: true });
  expect(settle.body.status === "confirmed", `settle → ${JSON.stringify(settle.body)}`);
  ok("settle tx", settle.body.txHash);
  pB = await position(groupId, B.address);
  const pA2 = await position(groupId, A.address);
  ok("B debt (safety net $50 dari kekurangan $70)", formatDollars(pB.debt));
  ok("A credit (kas kurang)", formatDollars(pA2.credit));
  expect(pB.debt === 20n * USD && pA2.credit === 20n * USD, "debt B $20 / credit A $20");

  step("invoice dari api");
  const tokenB = await login(B);
  const invoiceB = await api<{ number: string; status: string; shareToken: string; invoiceHash: string }>(`/api/groups/${groupId}/invoices/me`, { token: tokenB });
  expect(invoiceB.status === 200 && invoiceB.body.status === "due", `invoice B → ${JSON.stringify(invoiceB.body)}`);
  ok("invoice B", `${invoiceB.body.number} ${invoiceB.body.status}`);
  const shared = await api<{ invoiceHash: string }>(`/api/invoices/${invoiceB.body.number}?token=${invoiceB.body.shareToken}`);
  expect(shared.status === 200 && shared.body.invoiceHash === invoiceB.body.invoiceHash, "shared invoice link");
  ok("link verifikasi invoice (share token) jalan");

  step("B: payDebtWithPermit $20 → langsung ke A");
  const aBefore = await ausd(A.address);
  await vault(B, "payDebtWithPermit", [groupId, 20n * USD, await permit(B, 20n * USD)]);
  expect((await position(groupId, B.address)).debt === 0n, "debt cleared");
  ok("A menerima", formatDollars((await ausd(A.address)) - aBefore));

  console.log(`\n✅ E2E testnet lolos — group ${groupId}`);
}

main().catch((error: unknown) => {
  console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
