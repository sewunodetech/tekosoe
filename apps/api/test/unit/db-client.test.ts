import { describe, expect, it, vi } from "vitest";
import { createPool } from "../../src/db/client";

describe("createPool", () => {
  it("handles idle-connection errors instead of crashing the process", async () => {
    const onIdleError = vi.fn();
    const pool = createPool("postgres://user:pass@127.0.0.1:1/none", onIdleError);

    // pg emits this when the server (e.g. Neon's pooler) closes an idle client.
    // Without a listener, Node would throw it as an unhandled 'error' event.
    expect(() => pool.emit("error", new Error("Connection terminated unexpectedly"))).not.toThrow();
    expect(onIdleError).toHaveBeenCalledOnce();

    await pool.end();
  });
});
