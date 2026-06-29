import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#181716",
        paper: "#fbfaf7",
        lane: "#2f7d6d",
        strike: "#e84d3d",
        chalk: "#f4d35e"
      }
    }
  },
  plugins: []
};

export default config;

