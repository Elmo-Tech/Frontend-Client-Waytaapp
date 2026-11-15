/** Serialize user mutations synchronously, including time spent validating. */
export function createExclusiveTask() {
  let busy = false;
  return {
    get busy() {
      return busy;
    },
    async run<T>(task: () => Promise<T>): Promise<T | undefined> {
      if (busy) return undefined;
      busy = true;
      try {
        return await task();
      } finally {
        busy = false;
      }
    },
  };
}

/** Ignore superseded reads; invalidate on owner change or unmount. */
export function createRequestSequence() {
  let revision = 0;
  return {
    next() {
      const own = ++revision;
      return () => revision === own;
    },
    invalidate() {
      revision++;
    },
  };
}
