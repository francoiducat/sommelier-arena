/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fff5f5',
          100: '#fce8e8',
          200: '#f4cfcf',
          300: '#efafaf',
          400: '#ee8f8f',
          500: '#de6464',
          600: '#c93f3f',
          700: '#9e3333',
          800: '#7a2626',
          900: '#4f1414',
        },
      },
    },
  },
  plugins: [],
};
