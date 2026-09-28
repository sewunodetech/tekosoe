import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  MONAD_TESTNET_RPC_URL: z.string().url(),
  GROUP_VAULT_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  DATABASE_URL: z.string().optional(),
  RECEIPTS_STORAGE_ENDPOINT: z.string().url().optional(),
  RECEIPTS_STORAGE_BUCKET: z.string().default("receipts"),
  RECEIPTS_STORAGE_ACCESS_KEY: z.string().optional(),
  RECEIPTS_STORAGE_SECRET_KEY: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  ALCHEMY_API_KEY: z.string().optional(),
  ALCHEMY_GAS_POLICY_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
