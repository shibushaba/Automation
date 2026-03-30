/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:  "#e1492c",
        accent:   "#2596be",
        "primary-dark": "#c03a20",
        "accent-dark":  "#1a7a9e",
        ink:      "#0a0a0a",
        paper:    "#f2f2f0",
        muted:    "#e8e8e5",
      },
      fontFamily: {
        sans:  ["'Inter'", "system-ui", "sans-serif"],
        mono:  ["'JetBrains Mono'", "'Fira Mono'", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "9999px",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
