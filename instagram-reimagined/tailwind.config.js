/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-2": "rgb(var(--ink-2) / <alpha-value>)",
        "ink-3": "rgb(var(--ink-3) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        calm: "rgb(var(--calm) / <alpha-value>)",
        "calm-soft": "rgb(var(--calm-soft) / <alpha-value>)",
        heart: "#FF3040",
        ig: { orange: "#F58529", pink: "#DD2A7B", purple: "#8134AF", blue: "#515BD4" },
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)",
        lift: "0 2px 4px rgb(0 0 0 / 0.04), 0 24px 48px -24px rgb(0 0 0 / 0.22)",
        phone: "0 0 0 1px rgb(0 0 0 / 0.06), 0 40px 80px -30px rgb(0 0 0 / 0.45), 0 18px 36px -18px rgb(0 0 0 / 0.3)",
      },
      backgroundImage: {
        "ig-gradient": "linear-gradient(45deg, #F58529 0%, #DD2A7B 45%, #8134AF 75%, #515BD4 100%)",
      },
      letterSpacing: { tightest: "-0.04em" },
    },
  },
  plugins: [],
};
