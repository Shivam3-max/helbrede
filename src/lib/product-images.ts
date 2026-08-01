import { Product } from "./types";

function buildSampleImage(accent: string, surface: string, badge: string, icon: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" role="img" aria-label="${badge}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbfdff" />
          <stop offset="100%" stop-color="#eef4fa" />
        </linearGradient>
        <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="${surface}" />
        </linearGradient>
      </defs>

      <rect width="640" height="480" rx="34" fill="url(#bg)" />
      <rect x="26" y="26" width="588" height="428" rx="30" fill="url(#card)" stroke="#d7e3ef" stroke-width="2" />

      <rect x="58" y="54" width="154" height="36" rx="18" fill="${accent}" fill-opacity="0.12" />
      <text x="135" y="77" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="${accent}" letter-spacing="1.2">
        ${badge}
      </text>

      <g transform="translate(320 215)">
        <circle cx="0" cy="0" r="102" fill="${accent}" fill-opacity="0.10" />
        <circle cx="0" cy="0" r="74" fill="#ffffff" />
        ${icon}
      </g>

      <rect x="86" y="366" width="286" height="16" rx="8" fill="#dfe9f3" />
      <rect x="86" y="366" width="152" height="16" rx="8" fill="${accent}" fill-opacity="0.75" />
      <rect x="86" y="396" width="220" height="10" rx="5" fill="#d7e4ef" />
      <rect x="86" y="416" width="168" height="10" rx="5" fill="#e5edf5" />
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const ICONS = {
  ointment: `
    <g fill="none" stroke="#d46a4c" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-58 38 L36 -56 L84 -10 L-10 84 Z" fill="#fff3ee" />
      <path d="M20 -40 L66 6" />
      <path d="M-46 24 L0 70" />
    </g>
  `,
  tablets: `
    <g fill="none" stroke="#4d78a8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
      <rect x="-78" y="-22" width="72" height="44" rx="22" fill="#f1f7ff" />
      <path d="M-42 -22 V22" />
      <rect x="12" y="-64" width="54" height="128" rx="27" fill="#fff7ef" />
      <path d="M12 0 H66" />
    </g>
  `,
  drops: `
    <g fill="none" stroke="#2e8b80" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 -78 C42 -32 60 -4 60 28 C60 63 33 90 0 90 C-33 90 -60 63 -60 28 C-60 -4 -42 -32 0 -78 Z" fill="#eefcf9" />
      <path d="M0 -34 V42" />
      <path d="M-26 4 H26" />
    </g>
  `,
  syrup: `
    <g fill="none" stroke="#8a5aa6" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
      <rect x="-36" y="-78" width="72" height="22" rx="8" fill="#f8f0ff" />
      <path d="M-28 -56 H28 L46 72 H-46 Z" fill="#fff8f0" />
      <path d="M-32 8 H32" />
    </g>
  `,
  ayurvedic: `
    <g fill="none" stroke="#4b8b3b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-20 74 C-20 18 -62 -4 -90 -18 C-84 40 -54 82 -20 74 Z" fill="#f2fff0" />
      <path d="M20 74 C20 10 78 -20 100 -42 C104 28 72 82 20 74 Z" fill="#edf9ea" />
      <path d="M0 74 V-52" />
      <path d="M0 10 C-12 -6 -26 -14 -44 -22" />
      <path d="M0 -4 C16 -20 34 -30 56 -38" />
    </g>
  `,
  personalCare: `
    <g fill="none" stroke="#cb7a1f" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
      <rect x="-62" y="-18" width="124" height="54" rx="18" fill="#fff6ea" />
      <circle cx="-24" cy="9" r="6" fill="#cb7a1f" stroke="none" />
      <circle cx="0" cy="9" r="6" fill="#cb7a1f" stroke="none" />
      <circle cx="24" cy="9" r="6" fill="#cb7a1f" stroke="none" />
      <path d="M0 -70 C16 -48 34 -30 34 -8 C34 14 18 30 0 30 C-18 30 -34 14 -34 -8 C-34 -30 -16 -48 0 -70 Z" fill="#fff2df" />
    </g>
  `,
};

const GROUP_SAMPLE_IMAGES: Record<string, string> = {
  "Ointments & Creams": buildSampleImage("#d46a4c", "#fff6f1", "CREAM", ICONS.ointment),
  "Tablets & Capsules": buildSampleImage("#4d78a8", "#f5f9fe", "TABLETS", ICONS.tablets),
  Drops: buildSampleImage("#2e8b80", "#f2fbf9", "DROPS", ICONS.drops),
  "Syrups & Suspensions": buildSampleImage("#8a5aa6", "#faf6ff", "SYRUP", ICONS.syrup),
  "Ayurvedic Specialties": buildSampleImage("#4b8b3b", "#f5fcf3", "AYURVEDIC", ICONS.ayurvedic),
  "Personal Care & Soaps": buildSampleImage("#cb7a1f", "#fff9f1", "CARE", ICONS.personalCare),
  "Lotions, Powders & Antiseptics": buildSampleImage("#cb7a1f", "#fff9f1", "CARE", ICONS.personalCare),
  "Nutrition & Protein": buildSampleImage("#4b8b3b", "#f5fcf3", "NUTRITION", ICONS.ayurvedic),
  Other: buildSampleImage("#4d78a8", "#f5f9fe", "PRODUCT", ICONS.tablets),
};

export function sampleImageForGroup(group: string): string {
  return GROUP_SAMPLE_IMAGES[group] || GROUP_SAMPLE_IMAGES.Other;
}

export function sampleImageForProduct(product: Pick<Product, "image" | "group">): string | null {
  return product.image || sampleImageForGroup(product.group);
}
