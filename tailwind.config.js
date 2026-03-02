/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'papa-dark': '#0a121e',
        'papa-card': '#162231',
        'papa-orange': '#ff6b00',
        'papa-blue': '#00d1ff',
      },
    },
  },
  plugins: [],
}