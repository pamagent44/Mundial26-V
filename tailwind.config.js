/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'fifa-gold': '#D4AF37',
        'fifa-blue': '#0064B0',
        'fifa-red': '#ED1C24',
        'fifa-green': '#009A3E',
        primary: '#0064B0',
        secondary: '#ED1C24',
        accent: '#D4AF37',
        background: '#F5F5F5',
        surface: '#FFFFFF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}