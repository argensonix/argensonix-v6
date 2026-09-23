/**
 * Blur FM — cover artwork lookup via the iTunes Search API.
 *
 * Adapted from the iTunes artwork approach already used on nico.com.ar
 * (static/js/main.js: fetchCoverFromItunes / readItunesArtwork): a direct
 * client-side fetch to itunes.apple.com/search (CORS-enabled, no proxy
 * needed), upscaled to a sharper size, and cached in localStorage with a TTL
 * so repeat lookups for the same track are free.
 */
const CACHE_PREFIX = "blurfm-art|";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface ItunesResult {
  artworkUrl100?: string;
  artworkUrl60?: string;
}

interface ItunesResponse {
  resultCount?: number;
  results?: ItunesResult[];
}

interface CacheEntry {
  url: string;
  ts: number;
}

function normalizeArtworkUrl(rawUrl: string): string {
  const cleaned = rawUrl.trim();
  if (!cleaned) return "";
  // iTunes artwork URLs encode their size in the filename; ask for a crisper tile.
  const upscaled = cleaned.replace(/\/\d+x\d+bb\./, "/200x200bb.");
  if (upscaled.startsWith("http://")) {
    return `https://${upscaled.slice("http://".length)}`;
  }
  return upscaled;
}

function cacheKey(artist: string, track: string): string {
  return `${artist.trim().toLowerCase()}|${track.trim().toLowerCase()}`;
}

function readCache(key: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    if (!parsed || !parsed.ts || Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.url || "";
  } catch {
    return null;
  }
}

function writeCache(key: string, url: string): void {
  try {
    const entry: CacheEntry = { url, ts: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Private browsing / quota exceeded: skip caching, stay graceful.
  }
}

/** Look up cover art for a track. Resolves to "" when not found or on any failure. */
export async function fetchArtwork(artist: string, track: string): Promise<string> {
  const term = `${artist} ${track}`.trim().replace(/\s+/g, " ");
  if (!term) return "";

  const key = cacheKey(artist, track);
  const cached = readCache(key);
  if (cached !== null) return cached;

  const query = `entity=song&limit=1&term=${encodeURIComponent(term)}`;
  try {
    const res = await fetch(`https://itunes.apple.com/search?${query}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("iTunes search request failed");
    const payload = (await res.json()) as ItunesResponse;
    const first = payload.resultCount ? payload.results?.[0] : undefined;
    const url = normalizeArtworkUrl(first?.artworkUrl100 || first?.artworkUrl60 || "");
    writeCache(key, url);
    return url;
  } catch {
    return "";
  }
}
