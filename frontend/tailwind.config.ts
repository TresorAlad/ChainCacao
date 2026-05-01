import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'forest': '#1A3A2A',
        'cacao': '#5CC97A',
        'gold': '#D4A876',
        'earth': '#3B2A1A',
        'blockchain': '#0F2540',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1': ['22px', { fontWeight: '500' }],
        'h2': ['18px', {}],
        'h3': ['16px', {}],
        'body': ['14px', {}],
        'caption': ['13px', {}],
        'label': ['11px', { letterSpacing: '0.5px' }],
      },
    },
  },
  plugins: [],
}
export default config
