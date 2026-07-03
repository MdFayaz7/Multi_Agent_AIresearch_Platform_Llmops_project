/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0F14",
          panel: "#131922",
          border: "#232B36",
        },
        paper: {
          DEFAULT: "#F7F8FA",
          panel: "#FFFFFF",
          border: "#E2E6EB",
        },
        signal: {
          amber: "#F5A623",
          cyan: "#3FB6C9",
          success: "#3FCF8E",
          danger: "#F0556B",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
