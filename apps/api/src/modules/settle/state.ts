export interface SchedulerState {
  running: boolean;
  lastTickAt: string | null;
  lastTickDurationMs: number | null;
  lastError: string | null;
  dueCandidates: number | null;
}

export function createSchedulerState(): SchedulerState {
  return {
    running: false,
    lastTickAt: null,
    lastTickDurationMs: null,
    lastError: null,
    dueCandidates: null,
  };
}
