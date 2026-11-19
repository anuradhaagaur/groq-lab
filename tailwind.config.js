/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lab: {
          bg: '#08090c',
          panel: '#0e1017',
          elevated: '#141722',
          highlight: '#1a1f2e',
          border: '#1f2433',
          borderSubtle: 'rgba(255, 255, 255, 0.06)',
          borderBright: 'rgba(255, 255, 255, 0.14)',
          text: '#f3f4f6',
          muted: '#94a3b8',
          dim: '#64748b',
          faint: '#475569',
        },
        groq: {
          green: '#00f59b',
          greenHover: '#00dc8b',
          greenGlow: 'rgba(0, 245, 155, 0.15)',
          orange: '#f55036',
          orangeGlow: 'rgba(245, 80, 54, 0.15)',
          cyan: '#00d4ff',
          purple: '#b362ff',
          amber: '#fbbf24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', 'monospace'],
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        streamCursor: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'stream-cursor': 'streamCursor 0.8s infinite',
      }
    },
  },
  plugins: [],
}

