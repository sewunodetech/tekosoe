/**
 * One mutex per wallet: every outbound transaction for a given key is serialised
 * so two jobs can never race for the same nonce.
 */
export class Mutex {
  private tail: Promise<void> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.tail;
    this.tail = previous.then(() => next);
    await previous;
    return release;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

const mutexes = new Map<string, Mutex>();

/** Shared mutex registry keyed by wallet role ("drip" | "settler"). */
export function mutexFor(role: string): Mutex {
  let mutex = mutexes.get(role);
  if (!mutex) {
    mutex = new Mutex();
    mutexes.set(role, mutex);
  }
  return mutex;
}
