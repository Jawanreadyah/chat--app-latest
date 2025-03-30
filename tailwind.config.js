/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        "shiny-text": "shiny-text 8s infinite",
        "marquee": "marquee var(--duration, 30s) linear infinite",
        "marquee-reverse": "marquee-reverse var(--duration, 30s) linear infinite"
      },
      keyframes: {
        "shiny-text": {
          "0%, 90%, 100%": {
            "background-position": "calc(-100% - var(--shiny-width)) 0",
          },
          "30%, 60%": {
            "background-position": "calc(100% + var(--shiny-width)) 0",
          },
        },
        "marquee": {
          to: { transform: "translateX(-50%)" }
        },
        "marquee-reverse": {
          to: { transform: "translateX(50%)" }
        }
      },
      colors: {
        primary: "#5c6bc0",
        "primary-foreground": "#ffffff",
        secondary: "#7986cb",
        "secondary-foreground": "#ffffff",
        accent: "#7986cb",
        background: "#1a1b1e",
        foreground: "#e0e0e0",
        muted: "#2a2b2e",
        "muted-foreground": "#9e9e9e",
        popover: "#2a2b2e",
        "popover-foreground": "#e0e0e0",
        border: "#404040",
        input: "#404040",
        ring: "#5c6bc0",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
      },
    },
  },
  plugins: [],
};