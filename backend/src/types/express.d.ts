declare global {
  namespace Express {
    interface Request {
      /** Set by the request-id middleware; echoed back as `x-request-id`. */
      id?: string;
      /** Populated by requireAuth after a valid JWT. */
      auth?: { address: string };
      /** Populated by requireGroupMember once membership is confirmed on-chain. */
      groupId?: string;
    }
  }
}

export {};
