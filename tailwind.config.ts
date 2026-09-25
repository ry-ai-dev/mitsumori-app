import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f6fb",
          100: "#e7ecf6",
          500: "#3b5998",
          600: "#2f4778",
          700: "#25395f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
