/**
 * Blog data source — build-time bridge to the nico.ar WordPress REST API.
 *
 * All blog content is fetched at build time (static output), sanitized with
 * sanitize-html, and normalized into the small `BlogPost` shape the Astro
 * pages consume. Nothing here runs in the browser.
 *
 * Source of truth: https://wp.nico.ar/wp-json/wp/v2. Each post keeps a
 * `sourceUrl` (its original WordPress permalink) so detail pages can point
 * their canonical link back to the original and offer a "read on nico.ar"
 * secondary link.
 */
import sanitizeHtml from "sanitize-html";

const WP_BASE = "https://wp.nico.ar/wp-json/wp/v2";
/** WordPress caps per_page at 100; the blog is well under that today. */
const PER_PAGE = 100;

/** Normalized post used across the Blog index, detail pages and the Home teaser. */
export interface BlogPost {
  id: number;
  slug: string;
  /** Plain-ish title HTML (inline formatting + entities only, tags stripped). */
  titleHtml: string;
  /** Sanitized excerpt HTML (a short paragraph). */
  excerptHtml: string;
  /** Sanitized full article HTML — safe to render with set:html. */
  contentHtml: string;
  /** ISO date string (for <time datetime>). */
  isoDate: string;
  /** Human date, e.g. "May 15, 2026". */
  displayDate: string;
  /** Original WordPress permalink — used as canonical + secondary link. */
  sourceUrl: string;
  /** Featured image absolute URL, when present. */
  image?: string;
  imageAlt?: string;
  /** Category / tag names, for small chips. */
  terms: string[];
}

/* -------------------------------------------------------------------------- */
/* sanitize-html configuration                                                */
/* -------------------------------------------------------------------------- */

/** Titles: keep light inline formatting + entities, drop everything blocky. */
const TITLE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["em", "i", "strong", "b", "code", "sup", "sub", "span"],
  allowedAttributes: {},
};

/** Excerpts: a paragraph or two of inline text. */
const EXCERPT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "a", "em", "i", "strong", "b", "code", "br"],
  allowedAttributes: { a: ["href", "title"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
      target: "_blank",
    }),
  },
};

/** Full article body: rich but safe. No scripts, styles or event handlers. */
const CONTENT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "h5", "h6",
    "p", "a", "ul", "ol", "li", "blockquote", "pre", "code",
    "em", "i", "strong", "b", "u", "s", "sup", "sub", "mark", "abbr", "small",
    "br", "hr", "span", "div",
    "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "title", "name", "id"],
    img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
    iframe: ["src", "width", "height", "title", "allow", "allowfullscreen", "loading"],
    th: ["scope", "colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    "*": ["id"],
  },
  // Only embed iframes from known video hosts; drop any others entirely.
  allowedIframeHostnames: [
    "www.youtube.com", "youtube.com", "www.youtube-nocookie.com",
    "player.vimeo.com",
  ],
  // Keep images lazy + async and force http(s) sources only.
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href || "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: external
          ? { ...attribs, rel: "noopener noreferrer", target: "_blank" }
          : attribs,
      };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: "lazy", decoding: "async" },
    }),
  },
  allowedSchemes: ["http", "https", "mailto"],
  // WordPress wraps some blocks in <figure class="wp-block-*"> — allow classes
  // through untouched so any post-specific styling degrades to plain layout.
  allowedClasses: false as unknown as sanitizeHtml.IOptions["allowedClasses"],
};

/* -------------------------------------------------------------------------- */
/* Fetch + normalize                                                          */
/* -------------------------------------------------------------------------- */

/** Minimal shape of the WP REST fields we read (with `_embed`). */
interface WpPost {
  id: number;
  slug: string;
  date: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string; alt_text?: string }>;
    "wp:term"?: Array<Array<{ name?: string; taxonomy?: string }>>;
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function normalize(post: WpPost): BlogPost {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const terms = (post._embedded?.["wp:term"] ?? [])
    .flat()
    .filter((t) => t && t.taxonomy === "category")
    .map((t) => t.name)
    .filter((name): name is string => Boolean(name));

  return {
    id: post.id,
    slug: post.slug,
    titleHtml: sanitizeHtml(post.title.rendered, TITLE_OPTIONS),
    excerptHtml: sanitizeHtml(post.excerpt.rendered, EXCERPT_OPTIONS),
    contentHtml: sanitizeHtml(post.content.rendered, CONTENT_OPTIONS),
    isoDate: post.date,
    displayDate: dateFormatter.format(new Date(post.date)),
    sourceUrl: post.link,
    image: media?.source_url,
    imageAlt: media?.alt_text || "",
    terms,
  };
}

// Memoize across the build so the index, detail pages and Home teaser share a
// single network round-trip.
let cache: Promise<BlogPost[]> | null = null;

/** All published blog posts, newest first. Fetched once per build. */
export function getBlogPosts(): Promise<BlogPost[]> {
  if (!cache) {
    cache = (async () => {
      const url = `${WP_BASE}/posts?per_page=${PER_PAGE}&status=publish&_embed=1&orderby=date&order=desc`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          `Blog: WordPress API request failed (${res.status} ${res.statusText})`,
        );
      }
      const posts = (await res.json()) as WpPost[];
      return posts.map(normalize);
    })();
  }
  return cache;
}

/** A single post by slug, or undefined if it isn't published. */
export async function getBlogPost(
  slug: string,
): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug);
}
