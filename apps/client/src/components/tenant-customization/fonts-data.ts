export type FontOption = {
  name: string;
  category: "sans-serif" | "serif" | "display" | "monospace";
};

export const GOOGLE_FONTS = {
  sans: [
    { name: "Inter", category: "sans-serif" },
    { name: "Plus Jakarta Sans", category: "sans-serif" },
    { name: "DM Sans", category: "sans-serif" },
    { name: "Outfit", category: "sans-serif" },
    { name: "Manrope", category: "sans-serif" },
    { name: "Work Sans", category: "sans-serif" },
    { name: "Nunito", category: "sans-serif" },
    { name: "Quicksand", category: "sans-serif" },
    { name: "Poppins", category: "sans-serif" },
    { name: "Open Sans", category: "sans-serif" },
    { name: "Roboto", category: "sans-serif" },
    { name: "Lato", category: "sans-serif" },
    { name: "Montserrat", category: "sans-serif" },
    { name: "Source Sans Pro", category: "sans-serif" },
    { name: "Raleway", category: "sans-serif" },
  ],
  serif: [
    { name: "Playfair Display", category: "serif" },
    { name: "Cormorant Garamond", category: "serif" },
    { name: "Cormorant", category: "serif" },
    { name: "Lora", category: "serif" },
    { name: "Merriweather", category: "serif" },
    { name: "Source Serif Pro", category: "serif" },
    { name: "Libre Baskerville", category: "serif" },
    { name: "PT Serif", category: "serif" },
  ],
  display: [
    { name: "Space Grotesk", category: "display" },
    { name: "Archivo", category: "display" },
    { name: "Sora", category: "display" },
    { name: "Fredoka", category: "display" },
    { name: "Baloo 2", category: "display" },
    { name: "Comfortaa", category: "display" },
  ],
} as const satisfies Record<string, FontOption[]>;

export const ALL_FONTS: FontOption[] = [
  ...GOOGLE_FONTS.sans,
  ...GOOGLE_FONTS.serif,
  ...GOOGLE_FONTS.display,
];
