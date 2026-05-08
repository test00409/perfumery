// localStorageCache.ts

export type StorageCacheEnvelope<T> = {
  v: 1;
  savedAt: number;
  expiry?: number;
  data: T;
};

export function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorageCacheEnvelope<T> | T;

    // Back-compat: if older code stored plain data arrays/objects.
    if (parsed && typeof parsed === "object" && "data" in (parsed as any) && "savedAt" in (parsed as any)) {
      const env = parsed as StorageCacheEnvelope<T>;
      if (env.expiry && Date.now() > env.expiry) return null;
      return env.data;
    }

    return parsed as T;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T, ttlMs?: number) {
  if (typeof window === "undefined") return;
  const env: StorageCacheEnvelope<T> = {
    v: 1,
    savedAt: Date.now(),
    expiry: ttlMs ? Date.now() + ttlMs : undefined,
    data,
  };
  try {
    localStorage.setItem(key, JSON.stringify(env));
  } catch {
    // ignore quota / serialization errors
  }
}

export function isDirty(dirtyKey: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(dirtyKey) === "1";
}

export function markDirty(dirtyKey: string, dirty: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(dirtyKey, dirty ? "1" : "0");
}

