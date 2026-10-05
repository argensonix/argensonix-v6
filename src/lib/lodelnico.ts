/**
 * Lo del Nico data source — build-time bridge to the wp.lodelnico.com REST API.
 *
 * Follows the same shape as `blog.ts` (fetch + normalize once per build,
 * static output only, nothing runs in the browser) but never throws: the
 * Home photography strip is a visual extra, not core content, so if Lo del
 * Nico is unreachable or a post has no usable image, callers get an empty
 * array and the homepage renders without that section.
 *
 * Image resolution mirrors lodelnico-astro's own fetch script: prefer the
 * embedded featured image, otherwise fall back to the first <img> in the
 * post body (most Lo del Nico posts carry the photo there, with width/height
 * already inlined by WordPress).
 */

const WP_BASE = "https://wp.lodelnico.com/wp-json/wp/v2";
/** Fetched with some slack so posts without a resolvable image still leave enough for the strip. */
const FETCH_COUNT = 12;
const STRIP_COUNT = 7;

export interface PhotoStripItem {
  id: number;
  title: string;
  url: string;
  image: string;
  width?: number;
  height?: number;
}

interface WpMediaSize {
  source_url: string;
  width?: number;
  height?: number;
}

interface WpPost {
  id: number;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: { sizes?: Record<string, WpMediaSize> };
    }>;
  };
}

function decodeTitle(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#8216;|&#8217;|&#039;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function resolveFeaturedImage(post: WpPost) {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return null;
  const sizes = media.media_details?.sizes;
  const best = sizes?.large ?? sizes?.medium_large;
  if (best?.source_url) {
    return { src: best.source_url, width: best.width, height: best.height };
  }
  if (media.source_url) return { src: media.source_url };
  return null;
}

function resolveContentImage(post: WpPost) {
  const tag = post.content?.rendered?.match(/<img\b[^>]*>/i)?.[0];
  if (!tag) return null;
  const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
  if (!src) return null;
  const width = Number(tag.match(/\bwidth=["']?(\d+)/i)?.[1]) || undefined;
  const height = Number(tag.match(/\bheight=["']?(\d+)/i)?.[1]) || undefined;
  return { src, width, height };
}

function normalize(post: WpPost): PhotoStripItem | null {
  const resolved = resolveFeaturedImage(post) ?? resolveContentImage(post);
  if (!resolved) return null;
  return {
    id: post.id,
    title: decodeTitle(post.title?.rendered ?? "") || "Untitled",
    url: post.link,
    image: resolved.src,
    width: resolved.width,
    height: resolved.height,
  };
}

let cache: Promise<PhotoStripItem[]> | null = null;

/**
 * A small, recent selection of photos for the Home photography strip.
 * Fetched once per build; resolves to [] on any failure (network error,
 * timeout, bad response) rather than throwing.
 */
export function getPhotoStripItems(): Promise<PhotoStripItem[]> {
  if (!cache) {
    cache = (async () => {
      try {
        const url = `${WP_BASE}/posts?_embed=wp:featuredmedia&orderby=date&order=desc&per_page=${FETCH_COUNT}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return [];
        const posts = (await res.json()) as WpPost[];
        return posts
          .map(normalize)
          .filter((item): item is PhotoStripItem => item !== null)
          .slice(0, STRIP_COUNT);
      } catch {
        return [];
      }
    })();
  }
  return cache;
}
