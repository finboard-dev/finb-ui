/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './visualizations/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      colors: {
        ceramic: { 
          50: '#f8fafc' 
        },
        gray: {
          150: '#E4E5E5',
        },
        sidebar: {
          primary: '#F8F8F8',
          button: {
            add: '#171821',
          }
        },
        background: {
          sidebar: '#E4E5E5',
          button: {
            dark: '#2B2C36',
            blue: '#3E5BF9'
          },
          card: '#F8F8F8',
        },
        border: {
          primary: '#EFF1F5',
          button: '#0B2CE0',
          dropdown: '#EFF1F5',
          input: '#F5F7FB'
        },
        chat: {
          primary: '#EFF1F5'
        },
        text: {
          primary: '#2B2C36',
          placeholder: '#949599',
          secondary: '#949599',
          dropdown: '#171821',
          selected: '#3E5BF9',
          light: '#F1F1F1',
          heading: '#171821'
        },
        logo: {
          text: '#B7B7BA'
        },
        primary: '#2B2C36',
        sec: '#767A8B',
        'message-bg': '#F8F8F8',
        
        'strk-500': '#767A8B',
        'stroke-100': '#EFF1F5',
        'white-text': '#F1F1F1',
        // shadcn/ui colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}