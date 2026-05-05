// oklch values converted to hex for React Native (which doesn't parse oklch)
export const colors = {
  bg:         "#FAFAFA",
  surface:    "#FFFFFF",
  surface2:   "#F4F4F3",
  line:       "#ECECEC",
  lineStrong: "#DDDCDA",
  ink:        "#111111",
  ink2:       "#3A3A3A",
  muted:      "#8A8A8E",
  muted2:     "#B5B5B8",
  // accent: oklch(0.55 0.15 265)
  accent:     "#4338CA",
  // accentSoft: oklch(0.96 0.03 265)
  accentSoft: "#EEF2FF",
  // accentInk: oklch(0.36 0.13 265)
  accentInk:  "#312E81",
  // pos: oklch(0.55 0.13 160)
  pos:        "#16A34A",
  // neg: oklch(0.55 0.18 25)
  neg:        "#DC2626",
  // pill tones
  posBg:      "#F0FDF4",  // oklch(0.96 0.05 160)
  posText:    "#166534",  // oklch(0.36 0.12 160)
  negBg:      "#FEF2F2",  // oklch(0.96 0.05 25)
  negText:    "#B91C1C",  // oklch(0.45 0.16 25)
} as const;

/** Esquinas casi cuadradas (UI minimalista) */
export const radii = { sm: 3, md: 4, lg: 6, xl: 8 } as const;
export const fonts = { sans: "Inter" } as const;
export const shadows = {
  sm:   { shadowColor: "#111", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 0, elevation: 0 },
  card: { shadowColor: "#111", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  pop:  { shadowColor: "#111", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
} as const;
