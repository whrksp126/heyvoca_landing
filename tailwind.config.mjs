import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        sub: '#5C5C5C',
        mute: '#8A8A8A',
        hairline: '#ECECEC',
        surface: '#F7F7F7',
        primary: {
          700: '#E63CB1',
          600: '#FF4FC6',
          500: '#FF70D4',
          100: '#FFE9F7',
        },
        accent: {
          blue: '#2E90FA',
          amber: '#F79009',
        },
        // 5단계 암기 상태 토큰 (heyvoca_front MemorizationStatus.jsx 출처)
        memory: {
          unlearned: '#9D835A',
          leaf: '#77CE4F',
          plant: '#38CE38',
          carrot: '#F68300',
          overdue: '#F26A6A',
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
        display: ['Cafe24Ssurround', 'Pretendard Variable', 'sans-serif'],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Menlo',
          'ui-monospace',
          'monospace',
        ],
      },
      fontSize: {
        'display-2xl': ['80px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-xl': ['64px', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
        'display-lg': ['48px', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        'display-md': ['36px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'heading-lg': ['28px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-md': ['22px', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        body: ['16px', { lineHeight: '1.7' }],
        'body-sm': ['14px', { lineHeight: '1.6' }],
        caption: ['13px', { lineHeight: '1.5', letterSpacing: '0.01em' }],
      },
      maxWidth: {
        content: '1200px',
        prose: '70ch',
      },
      spacing: {
        'section-y': '120px',
        'section-y-tight': '80px',
      },
      borderRadius: {
        card: '16px',
        field: '8px',
      },
      boxShadow: {
        raise: '0 1px 0 rgba(10,10,10,0.04), 0 1px 2px rgba(10,10,10,0.04)',
        card: '0 1px 0 rgba(10,10,10,0.04), 0 8px 24px -12px rgba(10,10,10,0.08)',
        ring: '0 0 0 4px rgba(255,112,212,0.18)',
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'float-y': 'floatY 5s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        marquee: 'marquee 40s linear infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-ring': 'pulseRing 1.2s ease-out infinite',
      },
    },
  },
  plugins: [typography],
};
