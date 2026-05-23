// Mock data — replace with live feed from lodelnico.com when ready
// src values can be local images in public/img/snaps/ or external URLs

export interface Snap {
  src: string;
  alt: string;
  url?: string; // link to full photo or post
}

export const snaps: Snap[] = [
  {
    src: "https://picsum.photos/seed/snap1/400/400",
    alt: "A snap from lodelnico",
    url: "https://www.lodelnico.com",
  },
  {
    src: "https://picsum.photos/seed/snap2/400/400",
    alt: "A snap from lodelnico",
    url: "https://www.lodelnico.com",
  },
  {
    src: "https://picsum.photos/seed/snap3/400/400",
    alt: "A snap from lodelnico",
    url: "https://www.lodelnico.com",
  },
  {
    src: "https://picsum.photos/seed/snap4/400/400",
    alt: "A snap from lodelnico",
    url: "https://www.lodelnico.com",
  },
  {
    src: "https://picsum.photos/seed/snap5/400/400",
    alt: "A snap from lodelnico",
    url: "https://www.lodelnico.com",
  },
];
