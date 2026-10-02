import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { brand: { 50: "#eff8ff", 100: "#d6ecff", 500: "#1d77c9", 600: "#155fa3", 700: "#124d85", 900: "#0b2f52" } } } },
  plugins: [],
} satisfies Config;
