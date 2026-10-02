/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1a3a5c",
        secondary: "#27ae60",
        danger: "#e74c3c",
        warning: "#f39c12",
        info: "#2980b9",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Sora'", "sans-serif"],
      },
    },
  },
  plugins: [],
};