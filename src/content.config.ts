import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

/**
 * Project categories double as the filter groups on the Projects page.
 * Keep this list in sync with the filter pills in projects.astro.
 */
export const PROJECT_CATEGORIES = [
  "Web",
  "Radio",
  "Tools",
  "Design",
  "Experiments",
] as const;

/**
 * What kind of entry a card represents. Drives link behaviour later:
 *   project  — has (or will have) an internal case-study page
 *   gallery  — image-led entry
 *   external — links straight out to externalUrl
 *   archive  — historical / retired, kept for the record
 */
export const PROJECT_ENTRY_TYPES = [
  "project",
  "gallery",
  "external",
  "archive",
] as const;

const projects = defineCollection({
  // Markdown case studies live in src/content/projects/*.md
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    /** Card + page title, e.g. "Blur FM" */
    title: z.string(),
    /** Optional slug override; defaults to the file name (entry id) */
    slug: z.string().optional(),
    /** Display label, kept as a string for ranges like "2011-NOW" */
    year: z.string(),
    /** Short state label, e.g. "Live", "In progress", "Archived" */
    status: z.string().optional(),
    /** One-line summary used as the card subtitle */
    summary: z.string(),
    /** Small chips shown on the card, e.g. ["Branding", "Web"] */
    tags: z.array(z.string()).default([]),
    /** Filter groups — each must be one of PROJECT_CATEGORIES */
    categories: z.array(z.enum(PROJECT_CATEGORIES)).default([]),
    /** Optional thumbnail (path under /public or external URL).
        Cards must render gracefully when this is absent. */
    thumbnail: z.string().optional(),
    /** Entry kind — see PROJECT_ENTRY_TYPES */
    entryType: z.enum(PROJECT_ENTRY_TYPES).default("project"),
    /** Internal link (e.g. a future case-study page) */
    href: z.string().optional(),
    /** External link; cards open it in a new tab */
    externalUrl: z.string().url().optional(),
    /** Surfaced in the home "Selected projects" section */
    featured: z.boolean().default(false),
    /** Manual sort key (lower = earlier) */
    order: z.number().default(999),
    /** Role line for the project detail metadata panel */
    role: z.string().optional(),
    /** Tech / tools used */
    stack: z.array(z.string()).default([]),
    /** Hide from listings without deleting the file */
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
