export type WorkCategory =
  | "All"
  | "Audio & Video"
  | "Animation"
  | "Graphic Design"
  | "Logos"
  | "Web";

export interface WorkItem {
  slug: string;
  title: string;
  category: Exclude<WorkCategory, "All">;
  thumbnail: string; // path relative to public/ or external URL
  description?: string;
  url?: string;
  year?: number;
  featured?: boolean;
}

export const workCategories: WorkCategory[] = [
  "All",
  "Audio & Video",
  "Animation",
  "Graphic Design",
  "Logos",
  "Web",
];

export const workItems: WorkItem[] = [
  // Web
  {
    slug: "blur-fm",
    title: "Blur FM",
    category: "Web",
    thumbnail: "https://picsum.photos/seed/work-blurfm/600/450",
    description: "Online radio station design and development.",
    year: 2022,
    featured: true,
  },
  {
    slug: "mas-valor",
    title: "Mas Valor",
    category: "Web",
    thumbnail: "https://picsum.photos/seed/work-masvalor/600/450",
    description: "Corporate website for a Buenos Aires consultancy.",
    year: 2021,
  },
  {
    slug: "open-value",
    title: "Open Value",
    category: "Web",
    thumbnail: "https://picsum.photos/seed/work-openvalue/600/450",
    description: "Brand and web presence for a tech services company.",
    year: 2020,
    featured: true,
  },

  // Logos
  {
    slug: "argensonix-identity",
    title: "Argensonix Identity",
    category: "Logos",
    thumbnail: "https://picsum.photos/seed/work-arglogo/600/450",
    description: "Brand identity for Argensonix Multimedia.",
    year: 2019,
    featured: true,
  },
  {
    slug: "blur-fm-logo",
    title: "Blur FM Logo",
    category: "Logos",
    thumbnail: "https://picsum.photos/seed/work-blurlogo/600/450",
    description: "Logotype and brand mark for Blur FM online radio.",
    year: 2021,
  },

  // Graphic Design
  {
    slug: "mailing-campaigns",
    title: "Mailing Campaigns",
    category: "Graphic Design",
    thumbnail: "https://picsum.photos/seed/work-mailing/600/450",
    description: "Email marketing design for various clients.",
    year: 2022,
  },
  {
    slug: "banner-series",
    title: "Banner Series",
    category: "Graphic Design",
    thumbnail: "https://picsum.photos/seed/work-banners/600/450",
    description: "Display advertising banners for digital campaigns.",
    year: 2021,
  },

  // Animation
  {
    slug: "motion-intro",
    title: "Motion Intro",
    category: "Animation",
    thumbnail: "https://picsum.photos/seed/work-motion/600/450",
    description: "Animated intro for a product launch.",
    year: 2023,
    featured: true,
  },

  // Audio & Video
  {
    slug: "blur-fm-promos",
    title: "Blur FM Promos",
    category: "Audio & Video",
    thumbnail: "https://picsum.photos/seed/work-video/600/450",
    description: "Promo videos and audio production for Blur FM.",
    year: 2022,
  },
];
