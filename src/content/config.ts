import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Project categories double as the filter groups on the Projects page
 * (Stage 3). Keep this list in sync with the filter pills.
 */
export const PROJECT_CATEGORIES = [
  "Audio & Video",
  "Animation",
  "Graphic Design",
  "Logos",
  "Web",
] as const;

const projects = defineCollection({
  // Markdown case studies live in src/content/projects/*.md
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    /** Card + page title, e.g. "Blur FM" */
    title: z.string(),
    /** One-line summary used as the card subtitle */
    description: z.string(),
    /** Filter group — must be one of PROJECT_CATEGORIES */
    category: z.enum(PROJECT_CATEGORIES),
    /** Small chips shown on the card, e.g. ["Branding", "Web"] */
    tags: z.array(z.string()).default([]),
    /** Display label, kept as a string for ranges like "2011-NOW" */
    year: z.string(),
    /** Optional role line for the project detail metadata panel */
    role: z.string().optional(),
    /** Optional thumbnail (path under /public or external URL).
        Cards must render gracefully when this is absent. */
    thumbnail: z.string().optional(),
    /** Surfaced in the home "Selected projects" section */
    featured: z.boolean().default(false),
    /** Manual sort key (lower = earlier) */
    order: z.number().default(999),
    /** Hide from listings without deleting the file */
    draft: z.boolean().default(false),
    /** Optional primary CTA, e.g. { label: "TUNE IN NOW", href: "..." } */
    cta: z
      .object({
        label: z.string(),
        href: z.string(),
      })
      .optional(),
    /** Optional gallery for the project detail "What I built" section */
    gallery: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
        }),
      )
      .default([]),
  }),
});

export const collections = { projects };
