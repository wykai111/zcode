const PROBE_URL = 'https://api.glidetv.xyz';

const probe = async (): Promise<boolean> => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    await fetch(PROBE_URL, { method: 'HEAD', signal: ctrl.signal });
    clearTimeout(t);
    return true;
  } catch {
    return false;
  }
};

export const waitForNetwork = (maxWaitMs = 30000, intervalMs = 2000): Promise<boolean> => {
  return probe().then((ok) => {
    if (ok) return true;
    return new Promise<boolean>((resolve) => {
      const start = Date.now();
      const poll = async () => {
        const reachable = await probe();
        if (reachable) {
          resolve(true);
        } else if (Date.now() - start >= maxWaitMs) {
          resolve(false);
        } else {
          setTimeout(poll, intervalMs);
        }
      };
      setTimeout(poll, intervalMs);
    });
  });
};
