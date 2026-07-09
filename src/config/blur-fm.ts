/**
 * Blur FM — single configuration boundary for the in-header mini player.
 *
 * Everything network-facing about the player lives here so it can be corrected
 * in one place. The values below are the *real* public Blur FM endpoints
 * (sourced from the Blur FM site repo), public HTTPS only — no LAN URLs.
 *
 * Player logic (scripts/blur-fm/player.ts) and the content adapter
 * (scripts/blur-fm/now-playing.ts) both read from this object; neither
 * hardcodes a URL. To point the player at a different source later, change
 * this file only.
 */
export interface BlurFmConfig {
  /** Station name shown in the pill and the mobile mini-player. */
  stationName: string;

  /**
   * Public HTTPS stream mount played by the single <audio> element.
   *
   * Default: stream.blurfm.com/standard — the 128 kbps MP3 main stream. This is
   * the same mount the now-playing proxy reads (icecast.blurfm.com/standard), so
   * the pill metadata always matches the audio.
   *
   * Alternates on stream.blurfm.com:
   *   /high      → 320 kbps MP3 (HD)
   *   /datasaver →  64 kbps MP3
   *   /ultra     →  32 kbps aacPlus   (also /ultra.ogg for Ogg)
   * Mirror host play.blurfm.com uses different names (NB: /high there is 128 kbps):
   *   /max (320) · /high (128) · /low (64) · /ultralow (32)
   */
  streamUrl: string;

  /**
   * Public now-playing endpoint. Returns JSON: { success: boolean, title: string }
   * where `title` is "Artist - Title". CORS-enabled, polled client-side only.
   * Set to `null` to disable polling and fall back to `defaultNowPlaying`.
   *
   * NOTE: this is the only content-fetch surface in the player. A future
   * adapter (e.g. WordPress posts from wp.nico.ar) would be wired in
   * scripts/blur-fm/now-playing.ts, not here.
   */
  nowPlayingUrl: string | null;

  /** Poll interval for now-playing metadata, in milliseconds. */
  nowPlayingPollMs: number;

  /** Shown before metadata loads, when polling is disabled, or on failure. */
  defaultNowPlaying: string;
}

export const blurFm: BlurFmConfig = {
  stationName: "Blur FM",
  streamUrl: "https://stream.blurfm.com/standard",
  nowPlayingUrl: "https://www.blurfm.com/icecast-proxy.php",
  nowPlayingPollMs: 15000,
  defaultNowPlaying: "Live signal from the lab",
};
