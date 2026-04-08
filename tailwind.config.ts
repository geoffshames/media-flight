import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['N27Bold', 'sans-serif'],
        body: ['Work Sans', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0A0A0A',
          50: '#111111',
          100: '#1A1A1A',
          200: '#222222',
          300: '#2A2A2A',
        },
        accent: {
          DEFAULT: '#FD3737',
          light: '#FF5555',
          dark: '#CC2222',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#D4D4D8',
          muted: '#9CA3AF',
        },
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
