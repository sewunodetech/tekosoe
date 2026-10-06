# Tekosue — Technical Specification

> This is the original design. A few details changed during the build, and the decision records are the source of truth for those: [ADR 0002](decisions/0002-database-provider.md) (the metadata database is Neon Postgres, not Supabase), [ADR 0004](decisions/0004-api-express.md) (the backend is Express, not Hono) and [ADR 0005](decisions/0005-groupvault-v1.md) (GroupVault v1: signed invites, permit flows, a settle-up that can't get stuck). Where this document says "Supabase", read "the metadata database".

## Stack and repo layout

Everything is TypeScript in one monorepo: an Expo mobile app (iOS and Android), a small website, a mini backend, the contract and the indexer, plus a small database for off-chain metadata. All money data stays on-chain and is served by Envio.

| Layer | Choice | Why |
| --- | --- | --- |
| Mobile app | Expo (React Native, TypeScript) + Expo Router; built with EAS | Native iOS and Android from one codebase; meets the "mobile app" requirement of the Agora bounty |
| Chain access | viem + Mera (`@category-labs/mera`) | Mera handles keys and signing; viem sends transactions and reads the contract |
| App data | TanStack Query + GraphQL queries to Envio | Caching and automatic refresh for the feed and balances |
| Network | Monad testnet (chain ID 10143) | Fast settlement, low fees |
| Money | AUSD (Agora), 6 decimals | Required by the Agora bounty |
| Contract | Solidity + Foundry + OpenZeppelin | Fast unit and fuzz tests for the balance invariants |
| Indexer | Envio HyperIndex | Required by the Envio bounty; comes with its own database and GraphQL |
| Mini backend | Node/TypeScript service in Docker | Settle-up scheduler, MON drip, notifications and invoice updates from Envio (ADR 0014) |
| Gas | MON drip through the mini backend (Alchemy Gas Manager was evaluated and dropped, ADR 0014) | Users never hold MON |
| Our own database | Postgres + object storage from P0, accessed only through the mini backend | Profiles, trip names, payment titles and notes, encrypted receipts, read status, push subscriptions. Never balances |
| Repo | npm workspaces + Turborepo; a shared package with ABIs and types | One ABI shared by the app, the backend and the indexer |
| App distribution | Expo EAS | EAS Build: an Android APK and iOS TestFlight for judges; Expo Go for quick team testing |
| Small website | Static Next.js on Vercel at `www.tekosue.xyz` (ADR 0011, ADR 0012) | Invoice verification from a QR code, invite links that open the app, passkey domain-association files |
| Camera, files, on-device crypto | expo-camera, expo-image-picker, expo-document-picker, expo-print; react-native-quick-crypto | Receipt photos, AES-GCM and X25519 encryption on the phone, invoice PDFs |
| Notifications | Expo Notifications (tokens stored in `push_subs`) | Approval requests, nudges, invoice ready |

**Who does what**

- **The app** owns every user interaction. Transactions are signed on the device through Mera and sent straight to Monad.
- **Envio** is the read source for money: the feed, each member's balance, payment status and settle-up results. The app polls every few seconds, or subscribes where available.
- **The metadata database** holds what doesn't belong on a blockchain: member names and cities, trip names, payment titles and notes, encrypted receipts, read status and push subscriptions. The app joins Envio and database data on `groupId` and `spendId`.
- **The mini backend** has four jobs: call `settle` on the end date, pay gas or send a little MON to new accounts, be the only way in or out of the database, and send push notifications. Its keys are for gas and the database only. It never holds user funds or user keys.

**Why the backend is separate from Next.js API routes:** the scheduler has to run on time, all the time, and a small service in Docker is more dependable for that than a serverless cron. The simplest alternative would be everything in Next.js API routes with the scheduler on scheduled GitHub Actions.

**Data flow:** the user taps in the app → Mera signs → the transaction reaches the contract on Monad → Envio picks up the event → the app reads Envio's GraphQL → every member's feed updates. On the end date the backend calls `settle`, and the results flow through the same path.

AUSD on Monad testnet: `0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC`, verified against Agora's contract deployments page and on-chain.

**Repo layout**

```
tekosoe/
  apps/
    mobile/     # Expo (React Native) app: Expo Router, EAS Build
    web/        # small site: invoice verification, invite links, passkey domain files
    api/        # mini backend (Docker): scheduler, gas, metadata API, push; DB schema + migrations
  packages/
    contracts/  # Foundry: src/, test/, script/
    indexer/    # Envio: config.yaml, schema.graphql, src/EventHandlers.ts
    shared/     # ABIs, contract addresses, shared types, metadata schemas (zod)
  docs/         # BRD, PRD, spec, decision records
  README.md     # how to run it, contract addresses, transaction hashes, sponsor integrations
```

## Data model and contract state

Tekosue is a shared pot. Every deposit goes into one pot, and every member can spend from it until it runs out, without looking at how much they put in. The contract tracks two numbers per member: total deposits (`deposited`) and their total share of payments (`used`). Net balance = `deposited − used`, and the sum of every member's net balance always equals the pot.

**Example.** A, B and C each put in 100 (pot: 300). A spends 90 for everyone, B spends 60 for A and B, C spends 150 for everyone. The pot is now 0.

| Member | `deposited` | `used` | Net balance | Settle-up result |
| --- | --- | --- | --- | --- |
| A | 100 | 30 + 30 + 50 = 110 | −10 | Pays 10 |
| B | 100 | 30 + 30 + 50 = 110 | −10 | Pays 10 |
| C | 100 | 30 + 50 = 80 | +20 | Receives 20 |

**How each action changes state**

| Action | Effect | Money that moves |
| --- | --- | --- |
| `deposit(x)` by A | `deposited[A] += x`; pot += x | x AUSD from A to the pot |
| `spend` by A, x for participants P | `used[p] += share[p]` for each p; pot −= x | x AUSD from the pot to the recipient |
| Dispute by participant p | `used[p] −= share[p]`; `used[A] += share[p]` | None |
| `settle` on the end date | Negative balances are collected up to each member's limit; positive balances are paid back | AUSD from members' accounts to the pot, then from the pot to members |

**Data structures (draft)**

```solidity
enum GroupStatus { Active, Settled }
enum SpendStatus { Pending, Executed, Rejected }

struct Group {
    string name;
    address creator;
    bytes32 inviteHash;
    uint64 endsAt;             // the trip's end date
    uint64 disputeWindow;      // seconds
    uint256 approvalThreshold; // above this, one other member must approve
    uint256 pool;              // the pot
    GroupStatus status;
}

struct Spend {
    address spender;
    address to;                // a member, a demo shop or any other address
    uint256 amount;
    uint64 executedAt;
    SpendStatus status;
    bytes32 noteHash;
}

mapping(uint256 => Group) groups;
mapping(uint256 => address[]) members;         // at most 10 members per trip
mapping(uint256 => mapping(address => uint256)) deposited;
mapping(uint256 => mapping(address => uint256)) used;
mapping(uint256 => mapping(address => uint256)) pullCap; // the safety net: max collected at settle-up
mapping(uint256 => Spend[]) spends;
mapping(uint256 => mapping(uint256 => mapping(address => uint256))) shareOf;
mapping(uint256 => mapping(address => uint256)) debt;    // what's still owed after settle-up
mapping(uint256 => mapping(address => uint256)) credit;  // what's still due to a member
```

**The 10-member limit per trip** keeps settle-up to a single transaction with a simple loop.

## Off-chain database

Money and rules stay on-chain. The database only holds the metadata and personal data the app displays, and every row is tied to on-chain data through `groupId` and `noteHash`. Names, cities and notes must never go on a blockchain, because it's public and permanent.

**Tables**

| Table | Main columns | Used on screens | Phase |
| --- | --- | --- | --- |
| `profiles` | `address` (PK), `display_name`, `city`, `country_code`, `avatar_color` | Home, Invite, Trip members | P0 |
| `group_meta` | `group_id` (PK), `name`, `created_by` | Home, Trip, Invite | P0 |
| `spend_meta` | `group_id` + `note_hash` (PK), `spend_id`, `title`, `category`, `note`, `receipt_path` | Activity, Payment details, Approval | P0 |
| `spend_reviews` | `spend_id`, `member`, `seen_at`, `decision_note` | Waiting (Seen), Declined (the decliner's note) | P1 |
| `push_subs` | `address`, `expo_push_token`, `platform` | Nudges, settle-up reminders | P1 |
| `group_keys` | `group_id` + `member` (PK), `wrapped_key`, `key_version` | Opening receipts (Receipt locked / unlocked) | P0 |
| `receipts` | `group_id`, `spend_id`, `n`, `storage_path`, `receipt_hash`, `mime`, `attached_by` | Add receipt, receipt badge in Activity | P0 |
| `invoices` | `group_id` + `member` (PK), `number`, `status` (paid \| refunded \| due), `invoice_hash`, `issued_at` | Trip invoice, See your invoice | P0 |

Storage: a `receipts` bucket with paths `{group_id}/{spend_id}/{n}.bin`, holding ciphertext only.

**Integrity.** Before calling `spend`, the app computes `note_hash` = keccak256 of the canonical JSON `{title, category, note, receiptHash}` and passes it as `noteHash`. The backend rejects metadata whose hash doesn't match, and fills in `spend_id` once Envio has indexed `SpendRequested`. If the database ever disagrees with the on-chain hash, the app marks that payment "Unverified".

**Access.**

- The app never talks to the database directly; everything goes through the mini backend's API.
- The API requires a message signed by the member's address (EIP-191, signed with the Mera key) and checks trip membership on-chain before any read or write.
- Row-level security blocks anonymous access entirely; the service credentials live only in the backend.

**If the database is down.** Balances, payments and settle-up still show, straight from Envio. Only the labels disappear for a while: names show as short addresses and payment titles as "Payment".

## Contract functions

Every function that moves AUSD uses `nonReentrant` and `SafeERC20` and updates state before transferring. Invariant: the sum of (`deposited − used`) across members = `pool` = the trip's AUSD balance in the contract (before settle-up).

| Function | Who | Requirements (reverts otherwise) | Effect | Event |
| --- | --- | --- | --- | --- |
| `createGroup(name, inviteHash, endsAt, disputeWindow, approvalThreshold)` | Anyone | `endsAt` in the future; values within limits | New trip; the creator becomes a member | `GroupCreated`, `MemberJoined` |
| `joinGroup(groupId, inviteSecret, pullCap)` | Anyone | Trip active; secret matches; not yet a member; fewer than 10 members | Becomes a member; safety net recorded (the app also asks for an AUSD `approve` of `pullCap`) | `MemberJoined` |
| `deposit(groupId, amount)` | Member | Trip active; `amount > 0` | `deposited += amount`; `pool += amount` | `Deposited` |
| `spend(groupId, to, amount, participants, shares, noteHash)` | Member | Trip active; before `endsAt`; `amount ≤ pool`; participants are members; `shares` add up to `amount` | If `amount ≤ approvalThreshold`: paid immediately and participants' `used` goes up. Otherwise: Pending | `SpendExecuted` or `SpendRequested` |
| `approveSpend(groupId, spendId)` | A member other than the payer | Pending; `amount ≤ pool` | Paid; participants' `used` goes up | `SpendExecuted` |
| `rejectSpend(groupId, spendId)` | A member other than the payer | Pending | Rejected | `SpendRejected` |
| `disputeShare(groupId, spendId)` | Participant | Executed; within the dispute window | The participant's share moves to the payer | `ShareDisputed` |
| `settle(groupId)` | Anyone (usually the scheduler) | Trip active; time ≥ `endsAt + disputeWindow` | Collect negative balances up to each safety net; pay positive balances from the pot (pro rata if the pot is short); record what's left as `debt` and `credit`; mark Settled | `Settled`, `Pulled`, `Refunded` |
| `payDebt(groupId, amount)` | A member with `debt > 0` | Trip settled | AUSD comes in and goes straight to the members owed `credit` | `DebtPaid`, `Refunded` |
| `attachReceipt(groupId, spendId, receiptHash)` | The payer | The payment exists and belongs to the sender; trip not yet settled | Records the receipt's fingerprint; several per payment allowed; moves no money | `ReceiptAttached` |

**View functions for the app:** `getGroup`, `membersOf`, `balanceOf(groupId, member)` (deposited, used, net), `getSpend`. The feed and history come from Envio.

**Known limitation:** a shortfall can only be collected automatically up to the safety net (`pullCap`), and only while the member's AUSD balance covers it. The rest becomes a bill (`debt`), shown clearly in the app.

## Events and the Envio indexer schema

The app reads the trip list, feed, balances and settle-up results from Envio. It only reads the contract directly to double-check a balance before an important transaction.

**Contract events**

```solidity
event GroupCreated(uint256 indexed groupId, address indexed creator, string name, uint64 endsAt, uint256 approvalThreshold);
event MemberJoined(uint256 indexed groupId, address indexed member, uint256 pullCap);
event Deposited(uint256 indexed groupId, address indexed member, uint256 amount);
event SpendRequested(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount);
event SpendExecuted(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount, address[] participants, uint256[] shares, bytes32 noteHash);
event SpendRejected(uint256 indexed groupId, uint256 indexed spendId, address indexed by);
event ShareDisputed(uint256 indexed groupId, uint256 indexed spendId, address indexed participant, uint256 share);
event ReceiptAttached(uint256 indexed groupId, uint256 indexed spendId, address indexed by, bytes32 receiptHash);
event Settled(uint256 indexed groupId, uint256 poolBefore);
event Pulled(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingDebt);
event Refunded(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingCredit);
event DebtPaid(uint256 indexed groupId, address indexed member, uint256 amount);
```

**Indexer entities (draft `schema.graphql`)**

| Entity | Main fields | Used for |
| --- | --- | --- |
| `Group` | id, name, creator, endsAt, approvalThreshold, pool, status | Home, end-date countdown |
| `Member` | id (trip + address), deposited, used, net, pullCap, debt, credit | Per-member balance, bills, settle-up result |
| `Spend` | id, group, spender, to, amount, status, executedAt, noteHash | Payment details, approvals, disputes |
| `SpendShare` | id, spend, participant, share, disputed | The "who it was for" breakdown |
| `Activity` | id, group, type, actor, counterparty, amount, timestamp, txHash | The activity feed (one row per event) |

**Handler rule:** the indexer recomputes `Member.net = deposited − used` with exactly the same rules as the contract. Integration tests compare it with the contract's `balanceOf` for every member.

## Mera, gas and encryption

Mera is the only source of keys. The signing account for transactions and the encryption key for receipts are both derived from the same passkey, with different salts.

### Mera (account layer)

- Passkey → a plain EVM account (EOA); no smart-account contract is deployed.
- The signing session keeps the key in memory for the session, so users aren't asked for their passkey on every transaction.
- A passkey synced to another device produces the same account.
- Function names and usage are verified straight from the package source and public example repos, never guessed.
- In the Expo app, passkeys use the native APIs (ASAuthorization on iOS, Credential Manager on Android) through a React Native passkey module. Both need a domain serving `apple-app-site-association` and `assetlinks.json`, which `apps/web` provides.
- Whether the Mera SDK and the PRF extension run in React Native was the first spike. The fallback is to run the Mera step in an in-app browser on the same domain.

### Gas

| Option | How it works | Status |
| --- | --- | --- |
| Alchemy Gas Manager | Sponsor gas, or pay gas in AUSD, through EIP-7702 | Time-boxed to half a day; compatibility with Mera EOAs unproven |
| MON drip | The backend sends a little MON to new accounts during onboarding | The simplest fallback |
| Our own relayer | A relayer pays gas for transactions the user signed | Fallback if the drip isn't enough |

Whichever option we use, the backend only pays gas. It never holds user keys or user AUSD.

### Receipt encryption (P2, proposed design)

1. From the passkey, derive two keys through Mera's PRF with different salts: the signing key and the member's X25519 encryption key pair.
2. When a trip is created, the creator's app generates a random trip key (AES-256). It is wrapped for each member with their X25519 public key and stored in `group_keys`. New members get theirs when they join, wrapped by any member who is online.
3. Receipts and notes are encrypted with AES-GCM using the trip key on the phone before upload. The server only ever stores ciphertext.
4. On-chain holds only `noteHash` and `receiptHash`; the ciphertext lives in object storage (the `receipts` bucket). The server stores data it cannot read.

### Receipts from sellers

Every payment can carry real proof from the seller (a receipt photo, an e-ticket or a hotel's PDF invoice), encrypted and timestamped on-chain.

1. The payer taps "Add receipt" while paying, or later while the dispute window is open. Multiple pages are fine.
2. The phone compresses the photo, encrypts it, computes `receiptHash` = keccak256 of the ciphertext and uploads it to `receipts/{group_id}/{spend_id}/{n}.bin` through the API.
3. The phone calls `attachReceipt(groupId, spendId, receiptHash)`. Envio indexes `ReceiptAttached`, so a receipt can't be swapped quietly.
4. Other members open the receipt with their passkey: the trip key is unwrapped on the phone, the ciphertext is downloaded, its hash is checked against the chain, and it is decrypted on the phone.
5. Activity marks each payment "Receipt" or "No receipt". Anyone approving a payment above the limit sees a warning if there's no receipt yet.
6. Paying a demo shop with the simulated card produces a digital receipt from the shop automatically.

P1: on-device OCR reads the amount, shop name and date, and warns when the receipt doesn't match the payment from the pot.

### Per-member trip invoice

After `settle`, every member gets an invoice with their deposits, their share of each payment and how their final position was settled. All numbers come from Envio, all labels from the database.

- The backend listens for `Settled`, `Pulled` and `Refunded` and creates one `invoices` row per member. Numbers follow `INV-{trip}-{sequence}`, and `invoice_hash` = keccak256 of the invoice's canonical JSON.
- Status: **Refunded** (got money back), **Paid** (shortfall covered by the safety net) or **Due** (there's still `debt`). A Due invoice has a "Pay $X" button that calls `payDebt`; once `DebtPaid` arrives, it turns Paid.
- Every line links to its transaction on the Monad explorer. The verification page recomputes the invoice from on-chain data and checks `invoice_hash`.
- Members can only see their own invoice, through a signed request; share links use tokens that expire.

| Feature | Phase |
| --- | --- |
| In-app invoice screen, Paid/Refunded/Due status, Pay button for debts, per-line transaction links, save as PDF with expo-print | P0 |
| Server-generated PDF, sent by email | P1 |
| Local-currency estimate with the rate locked at settle-up, labelled "approx." | P1 |

### The safety net for automatic settle-up

- When joining, a member picks a safety net (`pullCap`), for example $50.
- The app asks for an AUSD `approve` to the contract for that amount in the same Mera signing session as `joinGroup`, so the user sees a single confirmation.
- On screen it reads: "The most the trip can collect from you if you're short at the end."

### Settle-up scheduler

- Contracts don't run by themselves. A small backend with an automatic schedule calls `settle` right after `endsAt + disputeWindow`.
- The backend only pays gas; it holds no keys or funds. Any member can also call `settle` as a fallback.
- Optional, once P0 is safe: run the scheduler on Chainlink CRE for the "Best workflow with CRE" bounty.

### Card (simulated), P2

- Only the card network is simulated. The payment is real: a `spend` from the pot to the demo shop's address, with participants chosen as usual.
- The app has a virtual Tekosue card screen (no Visa design or logo) and a list of demo shops with their addresses.
- The label "Card (simulated)" appears in the app, the README and the video. Issuing a real card (for example through a Visa issuing partner) is on the roadmap.

## Security and configuration

The biggest risks are in the contract that holds the trip's money and in invite links that could be abused.

| Threat | Mitigation |
| --- | --- |
| Reentrancy during AUSD transfers | `nonReentrant`, state updated before transfers, `SafeERC20` |
| Non-members taking actions | Every function checks membership |
| One member draining the pot for themselves | Payments above `approvalThreshold` need another member's approval; disputed shares move to the payer; losses are collected up to the safety net |
| A shortfall beyond the safety net, or a member's balance too low | The rest is recorded as `debt`, shown as a bill and paid with `payDebt` |
| Shares that don't add up to the amount | Revert when the sum of `shares != amount` |
| `settle` called too early | Only after `endsAt + disputeWindow` |
| The invite secret visible in the mempool during `joinGroup` | Accepted for v0.1 on testnet. Resolved in GroupVault v1 with signed, joiner-bound invites ([ADR 0005](decisions/0005-groupvault-v1.md)) |
| Keys or API keys leaking into the repo | `.env` files are git-ignored; only `.env.example` is committed |
| Metadata quietly changed in the database | The metadata hash must match the on-chain `noteHash`; if not, the app marks it "Unverified" |
| Outsiders reading a trip's names, notes or receipts | The API checks the address signature and on-chain membership; anonymous access is blocked; receipts are stored as ciphertext only |
| The database is unreachable | Money stays safe in the contract and shows from Envio; only names and titles disappear for a while |

**Configuration.** Every package ships a `.env.example` with empty values. The mobile app only receives public values (`EXPO_PUBLIC_*`: RPC URL, AUSD and vault addresses, Envio and API URLs, passkey domain). Secrets (database credentials, gas keys, push access token, optional Alchemy keys) exist only in `apps/api` and never in the app.
