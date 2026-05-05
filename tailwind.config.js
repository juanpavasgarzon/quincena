// Design tokens are defined in src/theme/tokens.ts (TypeScript source of truth).
// Values below must be kept in sync with that file.
// Note: tailwind.config.js runs in Node.js (PostCSS), not via Metro/Babel,
// so it cannot directly import the .ts file.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg:         "#F9F9F9",
        surface:    "#FFFFFF",
        surface2:   "#F4F4F3",
        line:       "#ECECEC",
        lineStrong: "#DDDCDA",
        ink:        "#111111",
        ink2:       "#3A3A3A",
        muted:      "#8A8A8E",
        muted2:     "#B5B5B8",
        // oklch(0.55 0.15 265)
        accent:     "#4338CA",
        // oklch(0.96 0.03 265)
        accentSoft: "#EEF2FF",
        // oklch(0.36 0.13 265)
        accentInk:  "#312E81",
        // oklch(0.55 0.13 160)
        pos:        "#16A34A",
        // oklch(0.55 0.18 25)
        neg:        "#DC2626",
      },
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
      },
      fontFamily: {
        sans: ["Inter", "System"],
      },
    },
  },
  plugins: [],
};
