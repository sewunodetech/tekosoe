// Tulis ABI GroupVault hasil `forge build` ke packages/shared supaya app, api, dan indexer
// tidak pernah menyimpang dari kontrak. Jalankan: npm run abi -w @tekosue/contracts
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const artifact = resolve(here, "../out/GroupVault.sol/GroupVault.json");
const target = resolve(here, "../../shared/src/abi/groupVault.ts");

const { abi } = JSON.parse(readFileSync(artifact, "utf8"));
const source = `// DIHASILKAN oleh packages/contracts/script/export-abi.mjs dari \`forge build\` — jangan diedit manual.
// Ubah kontrak, lalu: npm run abi -w @tekosue/contracts

/** enum GroupStatus / SpendStatus di-encode sebagai uint8. */
export const GROUP_STATUS = { Active: 0, Settled: 1 } as const;
export const SPEND_STATUS = { Pending: 0, Executed: 1, Rejected: 2 } as const;

export const groupVaultAbi = ${JSON.stringify(abi, null, 2)} as const;
`;
writeFileSync(target, source);
console.log(`wrote ${abi.length} ABI entries to ${target}`);
