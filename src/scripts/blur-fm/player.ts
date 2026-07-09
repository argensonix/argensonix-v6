/**
 * Blur FM — player controller (client only).
 *
 * Owns exactly ONE <audio> element and the playback state, and reflects that
 * state onto whatever controls happen to be in the document (the desktop pill,
 * the mobile menu row, the bottom mini-player). It knows nothing about *what*
 * is playing — track metadata comes from the now-playing adapter via subscribe.
 *
 * Design notes:
 *  - Single instance, guarded on `window.__blurfm`. The module script that
 *    boots it runs once; the <audio> lives inside a `transition:persist` block,
 *    so playback survives Astro client-side navigation.
 *  - Controls are wired with event delegation on `document`, so freshly
 *    rendered headers/menus need no rebinding. After each navigation we only
 *    re-`sync()` visual state (on `astro:after-swap`, before paint).
 *  - No autoplay: audio only starts from a user gesture (toggle click).
 *
 * Control contract (data attributes, set in the .astro components):
 *  - [data-blurfm-toggle]   → play/pause button (any number of them)
 *  - [data-blurfm-stop]     → stop + dismiss the mini-player
 *  - [data-blurfm-root]     → the mobile mini-player container (gets .is-active)
 *  - [data-blurfm-audio]    → the persistent <audio> element
 *  - [data-blurfm-marquee]  → marquee viewport (gets .is-scrolling + CSS vars)
 *  - [data-blurfm-now]      → text node holding the now-playing string
 *  - data-state on toggles  → "paused" | "loading" | "playing" (drives glyphs)
 */
import { blurFm } from "../../config/blur-fm";
import { createNowPlayingSource, type NowPlaying } from "./now-playing";

interface PlayerState {
  /** User has pressed play at least once → mobile mini-player is shown. */
  started: boolean;
  playing: boolean;
  loading: boolean;
  error: boolean;
  nowPlaying: NowPlaying;
}

class BlurFmController {
  private readonly audio: HTMLAudioElement;
  private readonly source = createNowPlayingSource();
  private readonly reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  private rafId = 0;

  private state: PlayerState = {
    started: false,
    playing: false,
    loading: false,
    error: false,
    nowPlaying: { text: blurFm.defaultNowPlaying, live: false },
  };

  constructor() {
    this.audio = this.ensureAudio();
    this.bindAudioEvents();
    this.bindControls();

    this.source.subscribe((np) => {
      this.state.nowPlaying = np;
      this.renderNowPlaying();
    });
    this.source.start();

    // Be polite: pause polling while the tab is hidden.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.source.stop();
      else this.source.start();
    });

    // Re-apply state to the freshly rendered controls after each navigation.
    document.addEventListener("astro:after-swap", () => this.sync());

    // Re-measure marquees on resize (throttled to one rAF).
    window.addEventListener("resize", () => {
      if (this.rafId) return;
      this.rafId = window.requestAnimationFrame(() => {
        this.rafId = 0;
        this.renderNowPlaying();
      });
    });

    this.sync();
  }

  /** Find the persisted <audio>, or create a single one as a fallback. */
  private ensureAudio(): HTMLAudioElement {
    let el = document.querySelector<HTMLAudioElement>("[data-blurfm-audio]");
    if (!el) {
      el = document.createElement("audio");
      el.setAttribute("data-blurfm-audio", "");
      el.preload = "none";
      document.body.appendChild(el);
    }
    return el;
  }

  private bindAudioEvents(): void {
    const a = this.audio;
    a.addEventListener("playing", () => {
      this.state.playing = true;
      this.state.loading = false;
      this.state.error = false;
      this.sync();
    });
    a.addEventListener("pause", () => {
      this.state.playing = false;
      this.state.loading = false;
      this.sync();
    });
    a.addEventListener("waiting", () => {
      if (this.state.started && !this.state.playing) {
        this.state.loading = true;
        this.sync();
      }
    });
    a.addEventListener("error", () => {
      this.state.playing = false;
      this.state.loading = false;
      this.state.error = true;
      this.sync();
    });
  }

  /** One delegated click handler covers all current and future controls. */
  private bindControls(): void {
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      const control = target?.closest("[data-blurfm-toggle],[data-blurfm-stop]");
      if (!control) return;
      event.preventDefault();
      if (control.hasAttribute("data-blurfm-stop")) this.stop();
      else this.toggle();
    });
  }

  // --- Playback (only ever invoked from a user gesture) ------------------

  toggle(): void {
    if (this.state.playing || this.state.loading) this.pause();
    else void this.play();
  }

  async play(): Promise<void> {
    this.state.started = true;
    this.state.loading = true;
    this.state.error = false;
    this.sync();
    try {
      // Re-point at the live edge each time so resume never plays stale buffer.
      const sep = blurFm.streamUrl.includes("?") ? "&" : "?";
      this.audio.src = `${blurFm.streamUrl}${sep}t=${Date.now()}`;
      this.audio.load();
      await this.audio.play();
    } catch {
      this.state.loading = false;
      this.state.error = true;
      this.sync();
    }
  }

  pause(): void {
    this.audio.pause();
    // `playing`/`loading` reset via the audio 'pause' event.
  }

  /** Stop the stream entirely and dismiss the mini-player. */
  stop(): void {
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.state.started = false;
    this.state.playing = false;
    this.state.loading = false;
    this.sync();
  }

  // --- Rendering ---------------------------------------------------------

  /** Public so init can re-sync an already-running instance. */
  sync(): void {
    const { playing, loading, started } = this.state;
    const dataState = playing ? "playing" : loading ? "loading" : "paused";
    const label = playing
      ? "Pause Blur FM"
      : loading
        ? "Loading Blur FM"
        : "Play Blur FM";

    document
      .querySelectorAll<HTMLElement>("[data-blurfm-toggle]")
      .forEach((btn) => {
        btn.dataset.state = dataState;
        btn.setAttribute("aria-label", label);
        btn.setAttribute("aria-pressed", String(playing));
      });

    document
      .querySelectorAll<HTMLElement>("[data-blurfm-root]")
      .forEach((root) => root.classList.toggle("is-active", started));

    // Reserve room for the fixed mobile mini-player only while it is visible.
    document.documentElement.classList.toggle("blurfm-has-mini", started);

    this.renderNowPlaying();
  }

  private renderNowPlaying(): void {
    const { text } = this.state.nowPlaying;
    document
      .querySelectorAll<HTMLElement>("[data-blurfm-now]")
      .forEach((el) => {
        if (el.textContent !== text) el.textContent = text;
        this.updateMarquee(el);
      });
  }

  /** Animate a marquee only when its text actually overflows + motion is allowed. */
  private updateMarquee(textEl: HTMLElement): void {
    const marquee = textEl.closest<HTMLElement>("[data-blurfm-marquee]");
    if (!marquee) return;

    // Skip elements that aren't visible (e.g. the desktop pill on mobile).
    if (!marquee.clientWidth) return;

    if (this.reduceMotion.matches) {
      marquee.classList.remove("is-scrolling");
      return;
    }

    const overflow = textEl.scrollWidth - marquee.clientWidth;
    if (overflow > 4) {
      const shift = overflow + 8;
      const seconds = Math.max(6, shift / 24);
      marquee.style.setProperty("--marquee-shift", `-${shift}px`);
      marquee.style.setProperty("--marquee-duration", `${seconds.toFixed(1)}s`);
      marquee.classList.add("is-scrolling");
    } else {
      marquee.classList.remove("is-scrolling");
      marquee.style.removeProperty("--marquee-shift");
    }
  }
}

declare global {
  interface Window {
    __blurfm?: BlurFmController;
  }
}

/** Boot (or re-sync) the single controller. Safe to call on every page load. */
export function initBlurFm(): void {
  if (window.__blurfm) {
    window.__blurfm.sync();
    return;
  }
  window.__blurfm = new BlurFmController();
}
