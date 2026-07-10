import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#FFB800',
        'gold-dark': '#e6a600',
        'gold-dim': 'rgba(255,184,0,0.12)',
        brand: {
          bg: '#0a0a0a',
          card: '#1a1a1a',
          card2: '#212121',
          side: '#0f0f0f',
          border: '#252525',
          muted: '#666666',
          muted2: '#999999',
          text: '#f0ece4',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
