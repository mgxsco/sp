/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#ffffff',
      },
      fontFamily: {
        tomorrow: ['Tomorrow', 'sans-serif'],
        tektur: ['Tektur', 'sans-serif'],
      },
      letterSpacing: {
        'super-wide': '0.2em',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'draw-line': 'drawLine 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drawLine: {
          '0%': { width: '0' },
          '100%': { width: '60px' },
        },
      },
    },
  },
  plugins: [],
}
