# 0008 — Encrypted receipts on the phone (M7)

- Status: accepted
- Date: 2026-10-02

## Context

Receipts were only a placeholder in the app. Live mode refused to attach them ("Receipts are not available yet"), so `attachReceipt` was never called, Envio never saw a `ReceiptAttached`, and Activity always said "No receipt". Demo mode pretended to succeed and the receipt screen always showed a hard-coded sample. The contract (`attachReceipt`), the indexer (`Spend.receipts`) and the api (presigned upload, hash check, members-only download, key exchange) were already in place.

The spec ([technical spec](../03-technical-spec.md) › Receipt encryption) derives the member's encryption key from the passkey through Mera's PRF with a separate salt. The app only holds a viem `LocalAccount` from Mera's signing session, not raw PRF output.

## Decision

- **Member key.** An X25519 key pair derived on the phone from a deterministic signature (RFC 6979) by the passkey-held account over a fixed message: `privateKey = sha256(signature)`. The same passkey gives the same key on any phone, nothing is stored, and the key never leaves the device. The public key is published with `PUT /api/keys/me`.
- **Trip key.** A random AES-256 key per trip, wrapped for each member with ECIES (ephemeral X25519 → HKDF-SHA256 → AES-GCM) and stored through `PUT /api/groups/:id/key-wraps` (insert-only). The first member to attach a receipt creates it. Whoever holds the key re-shares it with members who have published a public key since, every time they attach or open a receipt. A member with no wrapped copy can't create a new key once the trip already has receipts; they see "A friend needs to open the app once".
- **Receipt.** Compress to JPEG (max 1600 px, quality 0.7) with `expo-image-manipulator`, encrypt with AES-256-GCM using the trip key and `tekosoe/receipt/v1/<trip>/<payment>` as associated data, then `receiptHash = keccak256(ciphertext)`. Upload through the presigned URL, confirm (the api re-checks the hash), then `attachReceipt(groupId, spendId, receiptHash)` on-chain.
- **Opening.** Fetch the download link by hash (members only), check `keccak256(ciphertext)` against the on-chain hash, decrypt on the phone, show it.
- **Libraries.** `@noble/ciphers`, `@noble/curves` and `@noble/hashes`: audited, pure JS, so they run in Expo Go and on web with no native module.
- **Demo mode.** The photo you attach is kept in memory for the session and shown on R3; payments without a receipt can be opened so the payer can add one.

## Consequences

- Receipts work end to end only where the api has `FEATURE_RECEIPTS` and S3 storage configured. Otherwise the app says "Receipts are switched off on the server right now" and the payment itself is unaffected.
- The deterministic signature replaces the PRF salt for now. Moving to Mera PRF later means a new key version and re-wrapping trip keys; the message carries `v1` for that reason.
- Attaching a receipt is its own transaction after `spend`, so it needs one more confirmation.
- One photo per attach for now. Multi-page receipts and PDFs come later.
