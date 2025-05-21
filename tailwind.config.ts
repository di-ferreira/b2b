import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    screens: {
      // Breakpoints existentes
      tablet: {
        raw: '((max-width: 800px) and (orientation: portrait)) or ((max-width: 1340px) and (orientation: landscape))',
      }, // Modo genérico para tablet
      laptop: '1024px',
      desktop: '1280px',

      // Novos breakpoints para tablet em modos específicos
      'tablet-portrait': {
        raw: '(max-width: 800px) and (orientation: portrait)',
      },
      'tablet-landscape': {
        raw: '(max-width: 1340px) and (orientation: landscape)',
      },
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        montserrat: ['Montserrat', ...fontFamily.sans],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        emsoft_blue: { main: '#063778', light: '#0c6ff1', dark: '#031b3b' },
        emsoft_orange: { main: '#F27318', light: '#f59854', dark: '#bf560b' },
        emsoft_success: { main: '#22BB33', light: '#76e683', dark: '#0e4f16' },
        emsoft_danger: { main: '#BB2124', light: '#dd3f42', dark: '#85171a' },
        emsoft_dark: { main: '#0f0f0f', text: '#030202' },
        emsoft_light: { main: '#F6F6F6', surface: '#e6ebf1' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        colorChange: {
          '0%, 100%': { color: '#F27318' },
          '50%': { color: '#bf560b' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        colorChange: 'colorChange 1s linear infinite, spin 2s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;

