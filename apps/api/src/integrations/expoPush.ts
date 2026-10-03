import type { Env } from "../config/env";

/**
 * Expo Push Service (apps/mobile registers tokens with expo-notifications).
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Expo accepts at most 100 messages per request. */
const BATCH_SIZE = 100;

export const EXPO_PUSH_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/;

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  /** Delivered to the app as notification data (deep link + dedupe tag). */
  data: { url: string; tag: string };
}

/** "gone" = DeviceNotRegistered: the caller deletes the token. */
export type PushResult = "sent" | "gone" | "failed";

export interface PushService {
  /** One result per message, in the same order. Never throws. */
  sendMany(messages: PushMessage[]): Promise<PushResult[]>;
}

interface ExpoTicket {
  status?: "ok" | "error";
  details?: { error?: string };
}

export function createPushService(
  env: Pick<Env, "EXPO_ACCESS_TOKEN">,
  fetchImpl: typeof fetch = fetch,
): PushService {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  if (env.EXPO_ACCESS_TOKEN) headers.authorization = `Bearer ${env.EXPO_ACCESS_TOKEN}`;

  async function sendBatch(batch: PushMessage[]): Promise<PushResult[]> {
    try {
      const response = await fetchImpl(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        // Suara khas + channel Android yang dibuat app (apps/mobile/src/services/notifications.ts).
        body: JSON.stringify(batch.map((message) => ({ ...message, sound: "tekosoe.wav", channelId: "tekosoe-chime" }))),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) return batch.map(() => "failed");
      const payload = (await response.json()) as { data?: ExpoTicket[] };
      const tickets = Array.isArray(payload.data) ? payload.data : [];
      return batch.map((_, index) => {
        const ticket = tickets[index];
        if (ticket?.status === "ok") return "sent";
        if (ticket?.details?.error === "DeviceNotRegistered") return "gone";
        return "failed";
      });
    } catch {
      return batch.map(() => "failed");
    }
  }

  return {
    async sendMany(messages) {
      const results: PushResult[] = [];
      for (let start = 0; start < messages.length; start += BATCH_SIZE) {
        results.push(...(await sendBatch(messages.slice(start, start + BATCH_SIZE))));
      }
      return results;
    },
  };
}
