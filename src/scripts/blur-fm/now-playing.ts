/**
 * Blur FM — now-playing content adapter.
 *
 * This module owns ONLY metadata fetching + normalisation. It has no DOM and
 * no audio knowledge, so it can be swapped (or its `fetch` replaced) for a
 * future source — e.g. WordPress posts from wp.nico.ar — without touching
 * player.ts. The player just subscribes to a stream of `NowPlaying` values.
 */
import { blurFm } from "../../config/blur-fm";

export interface NowPlaying {
  /** Display string, e.g. "Artist · Title". */
  text: string;
  /** Artist name alone, when parseable from the source title (used for artwork lookups). */
  artist: string;
  /** Track title alone, when parseable from the source title (used for artwork lookups). */
  track: string;
  /** True when sourced live; false for the configured fallback label. */
  live: boolean;
}

type Listener = (value: NowPlaying) => void;

/** Shape returned by the Blur FM icecast proxy. */
interface NowPlayingResponse {
  success?: boolean;
  title?: string | null;
}

export interface NowPlayingSource {
  /** Subscribe to updates; the listener is primed immediately with the current value. */
  subscribe(listener: Listener): () => void;
  /** Begin polling (no-op if already running or no endpoint configured). */
  start(): void;
  /** Stop polling. */
  stop(): void;
}

export function createNowPlayingSource(): NowPlayingSource {
  const fallback: NowPlaying = {
    text: blurFm.defaultNowPlaying,
    artist: "",
    track: "",
    live: false,
  };
  let current: NowPlaying = fallback;
  const listeners = new Set<Listener>();
  let timer: number | undefined;

  const emit = () => {
    for (const listener of listeners) listener(current);
  };

  /** "Artist - Title" (Icecast StreamTitle) → { text: "Artist · Title", artist, track }. */
  const normalize = (raw: string): Pick<NowPlaying, "text" | "artist" | "track"> => {
    const trimmed = raw.trim();
    if (!trimmed) return { text: blurFm.defaultNowPlaying, artist: "", track: "" };
    const match = trimmed.match(/^(.+?)\s+-\s+(.+)$/);
    if (!match) return { text: trimmed, artist: "", track: "" };
    const artist = match[1].trim();
    const track = match[2].trim();
    return { text: `${artist} · ${track}`, artist, track };
  };

  const poll = async () => {
    if (!blurFm.nowPlayingUrl) return;
    try {
      const url = new URL(blurFm.nowPlayingUrl);
      // Cache-bust so intermediaries never serve stale now-playing data.
      url.searchParams.set("t", Date.now().toString());
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as NowPlayingResponse;
      if (data && data.title) {
        const next = normalize(data.title);
        if (next.text !== current.text || !current.live) {
          current = { ...next, live: true };
          emit();
        }
      }
    } catch {
      // Network/CORS hiccup: keep the last known value, stay graceful.
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(current);
      return () => listeners.delete(listener);
    },
    start() {
      if (!blurFm.nowPlayingUrl || timer !== undefined) return;
      void poll();
      timer = window.setInterval(() => void poll(), blurFm.nowPlayingPollMs);
    },
    stop() {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    },
  };
}
