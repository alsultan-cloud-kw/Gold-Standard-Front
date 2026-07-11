/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gold: {
          50: '#F7FEE7',
          100: '#ECFCCB',
          200: '#D9F99D',
          300: '#BEF264',
          400: '#A3E635',
          500: '#85E307',
          600: '#65B800',
          700: '#4F8E00',
          800: '#3F6F00',
          900: '#345900',
        },
        siteBg: '#ffffff',
        charcoal: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#0B0F19',
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      fontFamily: {
        sans: ['var(--font-ui)'],
        serif: ['var(--font-ui)'],
        brand: ['"The Year of The Camel"', 'var(--font-ui)'],
      },
      lineHeight: {
        body: 'var(--type-leading-body)',
        'body-rtl': 'var(--type-leading-body-rtl)',
        relaxed: 'var(--type-leading-relaxed)',
        'relaxed-rtl': 'var(--type-leading-relaxed-rtl)',
        heading: 'var(--type-leading-heading)',
        'heading-rtl': 'var(--type-leading-heading-rtl)',
        section: 'var(--type-leading-section)',
        'section-rtl': 'var(--type-leading-section-rtl)',
        display: 'var(--type-leading-display)',
        'display-rtl': 'var(--type-leading-display-rtl)',
        tight: '1.35',
        snug: '1.45',
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
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        /** LTR: seamless loop — scroll content left by exactly one track width. */
        "gold-marquee-ltr": {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "100%": { transform: "translate3d(-50%, 0, 0)" },
        },
        /** RTL: mirror direction for Arabic layout. */
        "gold-marquee-rtl": {
          "0%": { transform: "translate3d(-50%, 0, 0)" },
          "100%": { transform: "translate3d(0, 0, 0)" },
        },
        /** Navbar cart quantity badge — continuous blink while cart has items */
        "cart-badge-blink": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "25%": { opacity: "0.25", transform: "scale(0.92)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
          "75%": { opacity: "0.25", transform: "scale(0.92)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "gold-marquee-ltr": "gold-marquee-ltr 42s linear infinite",
        "gold-marquee-rtl": "gold-marquee-rtl 42s linear infinite",
        "cart-badge-blink": "cart-badge-blink 0.65s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}