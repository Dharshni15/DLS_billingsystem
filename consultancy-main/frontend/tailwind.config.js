/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f2',
          100: '#fde7e7',
          200: '#f8c9c9',
          300: '#ee9a9a',
          400: '#e06767',
          500: '#d71315', // Red from palette
          600: '#a90f11',
          700: '#650304', // Dark red from palette
          800: '#4c0507', // Chocolate brown
          900: '#330b0b', // Dark
          950: '#1a0a0e'  // Almost black
        }
      },
      boxShadow: {
        card: '0 10px 25px -10px rgba(0,0,0,0.4)'
      }
    }
  },
  plugins: []
}
