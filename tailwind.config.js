/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
          900: '#14532d',
        },
        stone: {
          50:  '#fafaf9',
          800: '#292524',
          900: '#1c1917',
        },
      },
    },
  },
};
