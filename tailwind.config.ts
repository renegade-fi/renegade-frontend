import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    backgroundSize: {
      "shimmer-button": "400% 400%",
    },
    extend: {
      backgroundImage: {
        "shimmer-button":
          "linear-gradient(135deg, #000000 0%, #3d3d3d 14%, #3d3d3d 14%, #111111 21%, #3d3d3d 39%, #010101 50%, #3d3d3d 61%, #161616 67%, #3d3d3d 80%, #212121 85%, #1b1b1b 100%)",
      },
      minHeight: {
        marquee: "38px",
      },
      fontFamily: {
        extended: ["var(--font-sans-extended)"],
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        sansLight: ["var(--font-sans-light)"],
      },
      colors: {
        // border: 'hsl(var(--border))',
        border: {
          DEFAULT: "hsl(var(--border))",
          brand: "hsl(var(--border-brand))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        green: {
          price: "#43e043",
        },
        red: {
          price: "#e04343",
        },
        yellow: "hsl(var(--chart-yellow))",
        blue: "hsl(var(--chart-blue))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "price-green": {
          "0%": { color: "#43e043" },
          "100%": { color: "inherit" },
        },
        "price-red": {
          "0%": { color: "#e04343" },
          "100%": { color: "inherit" },
        },
        "shimmer-button": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        ellipsis: {
          "0%, 100%": { opacity: "0" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "price-green": "price-green 0.5s ease-in-out",
        "price-red": "price-red 0.5s ease-in-out",
        "shimmer-button": "shimmer-button 45s ease infinite",
        marquee: "marquee var(--duration) linear infinite",
        ellipsis: "ellipsis 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
