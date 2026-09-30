import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../config/env";

/**
 * S3-compatible object storage for encrypted receipts only — the backend never
 * sees plaintext. Endpoint/force-path-style make it work with Neon Object Storage,
 * Cloudflare R2 or real S3.
 */
export interface StorageService {
  presignPut(
    key: string,
    options: { contentType: string; expiresIn: number },
  ): Promise<{ url: string; headers: Record<string, string> }>;
  presignGet(key: string, expiresIn: number): Promise<string>;
  head(key: string): Promise<{ contentLength: number } | null>;
  getBytes(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
}

export function createStorageService(env: Env): StorageService {
  const client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
  const bucket = env.S3_BUCKET;

  return {
    async presignPut(key, { contentType, expiresIn }) {
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
        { expiresIn },
      );
      return { url, headers: { "Content-Type": contentType } };
    },

    async presignGet(key, expiresIn) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
        expiresIn,
      });
    },

    async head(key) {
      try {
        const result = await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        return { contentLength: Number(result.ContentLength ?? 0) };
      } catch {
        return null;
      }
    },

    async getBytes(key) {
      try {
        const result = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        );
        if (!result.Body) return null;
        return await result.Body.transformToByteArray();
      } catch {
        return null;
      }
    },

    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
