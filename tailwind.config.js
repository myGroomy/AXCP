/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: 'rgb(from var(--color-g-1, #2563eb) calc(r * 1.8) calc(g * 1.8) calc(b * 1.8))',
          100: 'rgb(from var(--color-g-1, #2563eb) calc(r * 1.5) calc(g * 1.5) calc(b * 1.5))',
          200: 'rgb(from var(--color-g-1, #2563eb) calc(r * 1.3) calc(g * 1.3) calc(b * 1.3))',
          300: 'rgb(from var(--color-g-1, #2563eb) calc(r * 1.1) calc(g * 1.1) calc(b * 1.1))',
          400: 'rgb(from var(--color-g-1, #2563eb) calc(r * 0.9) calc(g * 0.9) calc(b * 0.9))',
          500: 'rgb(from var(--color-g-1, #2563eb) calc(r * 0.8) calc(g * 0.8) calc(b * 0.8))',
          600: 'var(--color-g-1, #2563eb)',
          700: 'rgb(from var(--color-g-1, #2563eb) calc(r * 0.7) calc(g * 0.7) calc(b * 0.7))',
          800: 'rgb(from var(--color-g-1, #2563eb) calc(r * 0.5) calc(g * 0.5) calc(b * 0.5))',
          900: 'rgb(from var(--color-g-1, #2563eb) calc(r * 0.3) calc(g * 0.3) calc(b * 0.3))',
        },
        gradient: {
          1: 'var(--color-g-1, #2563eb)',
          2: 'var(--color-g-2, #7c3aed)',
          3: 'var(--color-g-3, #06b6d4)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
