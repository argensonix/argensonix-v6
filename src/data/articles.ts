// Mock data — replace with live feed from nico.ar/feed when ready

export interface Article {
  title: string;
  url: string;
  date: string; // ISO 8601
  excerpt?: string;
}

export const articles: Article[] = [
  {
    title: "Rethinking MFA: What Happens When the User Sends the Code",
    url: "https://nico.ar",
    date: "2025-03-20",
    excerpt: "A look at the security tradeoffs of user-initiated verification flows.",
  },
  {
    title: "The Linux Designer",
    url: "https://nico.ar",
    date: "2025-02-14",
    excerpt: "What it's like building interfaces while living inside the terminal.",
  },
  {
    title: "The Psychology of the Web",
    url: "https://nico.ar",
    date: "2025-01-09",
    excerpt: "How visual rhythm and pacing shape the way we read online.",
  },
  {
    title: "The Future of User Authentication: Biometrics vs. Passkeys",
    url: "https://nico.ar",
    date: "2024-12-05",
    excerpt: "Comparing two approaches to passwordless auth at scale.",
  },
  {
    title: "The Importance of Digital Product Design",
    url: "https://nico.ar",
    date: "2024-11-18",
    excerpt: "Why craft still matters in a world of AI-generated everything.",
  },
];
