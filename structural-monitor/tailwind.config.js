/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f8f9fc",
          100: "#f1f3f8",
          200: "#e2e6ef",
          300: "#c5ccdb",
          400: "#9aa5bb",
          500: "#7a86a0",
          600: "#606d85",
          700: "#4e596e",
          800: "#3d4556",
          900: "#1e2230",
          950: "#12151f",
        },
        primary: {
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
        },
        danger: {
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
        },
        warning: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        success: {
          400: "#34d399",
          500: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
