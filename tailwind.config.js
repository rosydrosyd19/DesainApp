/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cad: {
          dark: '#0f172a',
          grid: '#1e293b',
          subgrid: '#334155',
          accent: '#38bdf8',
          wall: '#475569',
        }
      }
    },
  },
  plugins: [],
}
