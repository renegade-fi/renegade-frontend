import type { Config } from "tailwindcss";

const config = {
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    darkMode: ["class"],
    plugins: [require("tailwindcss-animate")],
    prefix: "",
    theme: {
        backgroundSize: {
            "shimmer-button": "400% 400%",
        },
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                ellipsis: "ellipsis 1.5s ease-in-out infinite",
                marquee: "marquee var(--duration) linear infinite",
                "price-green": "price-green 0.5s ease-in-out",
                "price-red": "price-red 0.5s ease-in-out",
                "shimmer-button": "shimmer-button 45s ease infinite",
            },
            backgroundImage: {
                "shimmer-button":
                    "linear-gradient(135deg, #000000 0%, #3d3d3d 14%, #3d3d3d 14%, #111111 21%, #3d3d3d 39%, #010101 50%, #3d3d3d 61%, #161616 67%, #3d3d3d 80%, #212121 85%, #1b1b1b 100%)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            colors: {
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                background: "hsl(var(--background))",
                blue: "hsl(var(--chart-blue))",
                border: {
                    brand: "hsl(var(--border-brand))",
                    DEFAULT: "hsl(var(--border))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                foreground: "hsl(var(--foreground))",
                green: {
                    price: "#43e043",
                },
                input: "hsl(var(--input))",
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                red: {
                    price: "#e04343",
                },
                ring: "hsl(var(--ring))",
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                sidebar: {
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    ring: "hsl(var(--sidebar-ring))",
                },
                yellow: "hsl(var(--chart-yellow))",
            },
            fontFamily: {
                extended: ["var(--font-sans-extended)"],
                mono: ["var(--font-mono)"],
                sans: ["var(--font-sans)"],
                sansLight: ["var(--font-sans-light)"],
                serif: ["var(--font-serif)"],
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
                ellipsis: {
                    "0%, 100%": {
                        opacity: "0",
                    },
                    "50%": {
                        opacity: "1",
                    },
                },
                marquee: {
                    from: {
                        transform: "translateX(0)",
                    },
                    to: {
                        transform: "translateX(calc(-100% - var(--gap)))",
                    },
                },
                "price-green": {
                    "0%": {
                        color: "#43e043",
                    },
                    "100%": {
                        color: "inherit",
                    },
                },
                "price-red": {
                    "0%": {
                        color: "#e04343",
                    },
                    "100%": {
                        color: "inherit",
                    },
                },
                "shimmer-button": {
                    "0%": {
                        backgroundPosition: "0% 50%",
                    },
                    "50%": {
                        backgroundPosition: "100% 50%",
                    },
                    "100%": {
                        backgroundPosition: "0% 50%",
                    },
                },
            },
            minHeight: {
                marquee: "41px",
            },
        },
    },
} satisfies Config;

export default config;
