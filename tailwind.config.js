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
        ceramic: { 50: '#f8fafc' },
        gray: {
          150: '#E4E5E5',
        },
        sidebar : {
          primary: '#F5F7FB',
          button : {
            add: '#171821',
          }
        },
        background: {
        sidebar: '#E4E5E5',
        button : {
          dark : '#2B2C36',
          blue: '#3E5BF9'
        },
        },
        border: {
         primary: '#EFF1F5',
         button: '#0B2CE0'
        },
        chat: {
          primary: '#EFF1F5'
        },
        text: {
          primary: '#2B2C36',
          placeholder: '#949599',
          dropdown: '#171821',
          selected: '#3E5BF9',
          light: '#F1F1F1'
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}