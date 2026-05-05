/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        legal: {
          dark: '#1a202c',
          gold: '#d4af37',
          corporate: '#2c3e50',
        }
      }
    },
  },
  plugins: [],
}
