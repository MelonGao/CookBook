/** Tailwind 配置：寻味的「手绘草稿本」设计 token —— 见 DESIGN_SYSTEM.md */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fdfbf7',
        pencil: '#2d2d2d',
        muted: '#e5e0d8',
        accent: '#ff4d4d',
        ballpoint: '#2d5da1',
        postit: '#fff9c4',
      },
      fontFamily: {
        title: ['Kalam', '"LXGW WenKai"', 'cursive'],
        hand: ['"Patrick Hand"', '"LXGW WenKai"', 'cursive'],
        serif: ['Kalam', '"LXGW WenKai"', 'cursive'],
        sans: ['"Patrick Hand"', '"LXGW WenKai"', 'cursive'],
      },
      fontSize: {
        display: ['64px', { lineHeight: '1.05' }],
        h1: ['48px', { lineHeight: '1.1' }],
        h2: ['32px', { lineHeight: '1.2' }],
        h3: ['24px', { lineHeight: '1.3' }],
        body: ['18px', { lineHeight: '1.7' }],
        meta: ['14px', { lineHeight: '1.5' }],
      },
      borderRadius: {
        wobbly: '255px 15px 225px 15px / 15px 225px 15px 255px',
        'wobbly-md': '30px 5px 25px 5px / 5px 25px 5px 30px',
        'wobbly-sm': '12px 3px 10px 3px / 3px 10px 3px 12px',
        'wobbly-blob': '63% 37% 54% 46% / 55% 48% 52% 45%',
      },
      boxShadow: {
        hand: '4px 4px 0px 0px #2d2d2d',
        'hand-lg': '8px 8px 0px 0px #2d2d2d',
        'hand-sm': '2px 2px 0px 0px #2d2d2d',
        'hand-hover': '2px 2px 0px 0px #2d2d2d',
        'hand-lift': '12px 12px 0px 0px #2d2d2d',
        paper: '3px 3px 0px 0px rgba(45, 45, 45, 0.1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slow-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease both',
        'slow-bounce': 'slow-bounce 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
