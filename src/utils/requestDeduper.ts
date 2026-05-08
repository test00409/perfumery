// requestDeduper.ts


type Fetcher<T> = () => Promise<T>;

// Module-level caches survive React StrictMode remounts (dev).
const inFlight = new Map<string, Promise<unknown>>();

function stableStringify(value: unknown): string {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function buildRequestKey(input: {
  url: string;
  method?: string;
  body?: unknown;
  tokenKey?: string;
}): string {
  const method = (input.method || "GET").toUpperCase();
  const tokenPart =
    typeof window !== "undefined" && input.tokenKey
      ? `|t=${localStorage.getItem(input.tokenKey) || ""}`
      : "";
  const bodyPart = input.body ? `|b=${stableStringify(input.body)}` : "";
  return `${method}|${input.url}${tokenPart}${bodyPart}`;
}

/**
 * Ensures the same request key only runs once at a time.
 * IMPORTANT: this dedupes the async work; it does not cache results forever.
 */
export function dedupe<T>(key: string, fetcher: Fetcher<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = fetcher().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, p as Promise<unknown>);
  return p;
}

