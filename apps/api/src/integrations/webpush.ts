import webpush from "web-push";
import type { Env } from "../config/env";

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export type PushResult = "sent" | "gone" | "failed";

export interface PushService {
  readonly publicVapidKey: string;
  send(target: PushTarget, payload: PushPayload): Promise<PushResult>;
}

export function createPushService(env: Env): PushService {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

  return {
    publicVapidKey: env.VAPID_PUBLIC_KEY,

    async send(target, payload) {
      try {
        await webpush.sendNotification(
          { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
          JSON.stringify(payload),
          { TTL: 3600 },
        );
        return "sent";
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410 mean the subscription is gone — callers delete the row.
        if (status === 404 || status === 410) return "gone";
        return "failed";
      }
    },
  };
}
