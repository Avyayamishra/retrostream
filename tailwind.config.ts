import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: "var(--bg)",
                panel: "var(--panel)",
                accent1: "var(--accent-1)",
                accent2: "var(--accent-2)",
                muted: "var(--muted)",
                teal: "var(--teal)",
                gold: "var(--gold)",
            },
            fontFamily: {
                serif: ["var(--font-playfair)", "serif"],
                sans: ["var(--font-source)", "sans-serif"],
                mono: ["var(--font-courier)", "monospace"],
            },
            animation: {
                "spin-slow": "spin 8s linear infinite",
            },
        },
    },
    plugins: [],
};
export default config;
