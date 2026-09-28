/**
 * Handler Envio untuk GroupVault. SKELETON — jalankan `pnpm codegen` dulu supaya modul `generated` ada,
 * lalu verifikasi API (`indexer.onEvent`, `context.<Entity>.get/set`) terhadap tipe hasil codegen.
 *
 * Aturan: Member.net = deposited − used dihitung ulang dengan aturan yang sama persis seperti kontrak.
 * Uji integrasi membandingkannya dengan `balanceOf` di kontrak untuk setiap anggota.
 */
import { indexer } from "generated";

indexer.onEvent({ contract: "GroupVault", event: "GroupCreated" }, async ({ event, context }) => {
  context.Group.set({
    id: event.params.groupId.toString(),
    name: event.params.name,
    creator: event.params.creator,
    endsAt: event.params.endsAt,
    approvalThreshold: event.params.approvalThreshold,
    pool: 0n,
    status: "Active",
  });
});

// TODO: MemberJoined, Deposited, SpendRequested, SpendExecuted, SpendRejected, ShareDisputed,
// ReceiptAttached, Settled, Pulled, Refunded, DebtPaid — masing-masing juga menulis satu baris Activity.
