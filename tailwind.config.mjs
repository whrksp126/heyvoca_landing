import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          600: '#FF70D4',
          500: '#FF88DC',
          400: '#FFAAE6',
          300: '#FFBDEB',
          200: '#FFD7F3',
          100: '#FFEEFA',
          50: '#FFF4FC',
        },
        accent: {
          blue: '#2E90FA',
          purple: '#7A5AF8',
          yellow: '#FB6514',
          mint: '#00D0BF',
        },
        ink: {
          900: '#111111',
          700: '#404040',
          500: '#7B7B7B',
          300: '#CCCCCC',
          200: '#DDDDDD',
          100: '#F5F5F5',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'sans-serif',
        ],
      },
      maxWidth: {
        content: '1200px',
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'float-y': 'floatY 4s ease-in-out infinite',
        'fade-up': 'fadeUp 0.7s ease-out both',
      },
    },
  },
  plugins: [typography],
};
