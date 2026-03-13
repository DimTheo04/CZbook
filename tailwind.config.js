/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          500: '#D4AF37', // Χρυσό για premium look
          600: '#B8860B',
        }
      }
    },
  },
  plugins: [],
}