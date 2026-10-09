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
        ops: {
          bg: '#0F1115',
          panel: '#15181E',
          card: '#1B1E26',
          elevated: '#222732',
          hover: '#292F3D',
          border: '#2A303C',
          borderSubtle: '#1E232B',
          text: '#F1F5F9',
          muted: '#94A3B8',
        },
        status: {
          critical: '#EF4444',
          criticalBorder: '#7F1D1D',
          criticalBg: '#450A0A',
          warning: '#F59E0B',
          warningBorder: '#78350F',
          warningBg: '#451A03',
          info: '#3B82F6',
          cyan: '#06B6D4',
          success: '#10B981',
          successBorder: '#064E3B',
          neutral: '#64748B',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        heavy: ['Rubik', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'card-hover': '0 10px 28px -4px rgba(0, 0, 0, 0.6)',
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.25)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.25)',
      },
    },
  },
  plugins: [],
}
