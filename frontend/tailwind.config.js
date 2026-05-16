/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a192f',
          950: '#020c1b',
        },
        slate: {
          850: '#151e2e',
          950: '#020617',
        },
        red: {
          450: '#e83f3f',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(239, 68, 68, 0.4)',
        'glow-strong': '0 0 40px rgba(239, 68, 68, 0.6)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}