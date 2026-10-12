import type { Config } from 'tailwindcss';
export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './games/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        border: 'hsl(var(--border))',
        primary: { DEFAULT: '#ec633c', foreground: '#fff' },
        secondary: '#eae9e2',
      },
      fontFamily: { sans: ['Arial', 'Helvetica', 'sans-serif'] },
      borderRadius: { xl: '16px', '2xl': '22px', '3xl': '28px' },
    },
  },
  plugins: [],
} satisfies Config;
