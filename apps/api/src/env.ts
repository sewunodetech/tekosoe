import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  MONAD_TESTNET_RPC_URL: z.string().url(),
  GROUP_VAULT_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  ALCHEMY_API_KEY: z.string().optional(),
  ALCHEMY_GAS_POLICY_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
