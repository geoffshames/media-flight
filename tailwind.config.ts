import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['N27', 'sans-serif'],
        body: ['Work Sans', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#141414',
          50: '#1A1A1A',
          100: '#262626',
          200: '#333333',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#E4E4E9',
          muted: '#B8B8C0',
        },
        accent: '#FD3737',
        tier: {
          green: '#00E676',
          yellow: '#FFD600',
          orange: '#FF9100',
          red: '#FF1744',
        },
      },
    },
  },
  plugins: [],
};

export default config;
