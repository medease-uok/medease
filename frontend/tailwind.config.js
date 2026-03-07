/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0F766E',
          700: '#0D6560',
          800: '#115E59',
          900: '#134E4A',
        },
        cta: {
          DEFAULT: '#0369A1',
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0369A1',
          600: '#075985',
        },
        success: {
          DEFAULT: '#10B981',
          bg: '#D1FAE5',
          text: '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: '#FEF3C7',
          text: '#92400E',
        },
        error: {
          DEFAULT: '#EF4444',
          bg: '#FEE2E2',
          text: '#991B1B',
        },
      },
      fontFamily: {
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        heading: ['Lexend', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}
